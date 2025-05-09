import os
import torch
import timm
import pickle
import numpy as np
import torchvision.transforms as transforms
import pdfkit
from flask import Flask, request, render_template, send_file, url_for
from werkzeug.utils import secure_filename
from PIL import Image
from datetime import datetime
import pandas as pd

# Initialize Flask App
app = Flask(__name__)

# Set path to wkhtmltopdf (Windows)
PDFKIT_CONFIG = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")

# Define Paths
UPLOAD_FOLDER = "static/uploads"
REPORTS_FOLDER = "static/reports"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["REPORTS_FOLDER"] = REPORTS_FOLDER

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Global variables to store latest results
latest_prediction = None
latest_image_path = None
latest_dn_params = None

# Model Paths
RESNET50_PATH = "Model/diabetic_retinopathy_resnet50.pth"
VIT_PATH = "Model/diabetic_retinopathy_vit.pth"
RF_PATH = "Model/random_forest_diabetic_nephropathy.pkl"
XGB_PATH = "Model/xgboost_diabetic_nephropathy.pkl"
SCALER_PATH = "Model/scaler.pkl"

# Class Labels
DR_CLASSES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]

# Load Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load Models
print("Loading Retinopathy Models...")
model_resnet50 = timm.create_model("resnet50", pretrained=False, num_classes=5)
model_resnet50.load_state_dict(torch.load(RESNET50_PATH, map_location=device))
model_resnet50.to(device).eval()

model_vit = timm.create_model("vit_base_patch16_224", pretrained=False, num_classes=5)
model_vit.load_state_dict(torch.load(VIT_PATH, map_location=device))
model_vit.to(device).eval()

print("Loading Nephropathy Models...")
with open(RF_PATH, "rb") as f:
    model_rf = pickle.load(f)

with open(XGB_PATH, "rb") as f:
    model_xgb = pickle.load(f)

print("Loading Scaler...")
with open(SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)

# Feature Names
DN_FEATURES = {
    "Age": "Age",
    "Diabetes duration (y)": "Diabetes duration (y)",
    "SBP (mmHg)": "SBP (mmHg)",
    "DBP (mmHg)": "DBP (mmHg)",
    "HbA1c (%)": "HbA1c (%)",
    "FBG (mmol/L)": "FBG (mmol/L)",
    "C-peptide (ng/ml)": "C-peptide (ng/ml)",
    "LDLC (mmoll)": "LDLC (mmoll)",
    "Serum Creatine": "Serum Creatine",
    "Albuminuria": "Albuminuria"
}

# Allowed file types check
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Image Transformations
def transform_image(image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    ])
    return transform(image).unsqueeze(0).to(device)

# Retinopathy Prediction
def predict_retinopathy(image_path):
    image = Image.open(image_path).convert("RGB")
    image_tensor = transform_image(image)

    with torch.no_grad():
        resnet_output = model_resnet50(image_tensor)
        vit_output = model_vit(image_tensor)

    resnet_probs = torch.nn.functional.softmax(resnet_output, dim=1)
    vit_probs = torch.nn.functional.softmax(vit_output, dim=1)

    ensemble_probs = (0.4 * resnet_probs) + (0.6 * vit_probs)
    final_pred = torch.argmax(ensemble_probs, dim=1).item()

    return DR_CLASSES[final_pred]

# Nephropathy Prediction
def predict_nephropathy(input_features):
    try:
        input_array = np.array([input_features]).reshape(1, -1)
        input_scaled = scaler.transform(input_array)  # Normalize input

        rf_pred = model_rf.predict_proba(input_scaled)[:, 1]
        xgb_pred = model_xgb.predict_proba(input_scaled)[:, 1]

        final_pred = (0.5 * rf_pred) + (0.5 * xgb_pred)
        return "Diabetic Nephropathy" if final_pred > 0.5 else "No Nephropathy"

    except Exception as e:
        return f"Error in prediction: {str(e)}"

# Home Page (New Route)
@app.route("/")
def home():
    return render_template("home.html")

# Prediction Tool Page
@app.route("/prediction", methods=["GET", "POST"])
def index():
    global latest_prediction, latest_image_path, latest_dn_params

    if request.method == "POST":
        predict_dr = "predict_dr" in request.form
        predict_dn = "predict_dn" in request.form

        # If neither DR nor DN is selected, return an error message
        if not predict_dr and not predict_dn:
            return render_template("index.html", features=DN_FEATURES.keys(),
                                   message="⚠️ Please select at least one prediction option (DR or DN).")

        dr_result, dn_result, file_path = None, None, None

        # Process DR prediction if selected
        if predict_dr:
            if "file" not in request.files or request.files["file"].filename == "":
                return render_template("index.html", features=DN_FEATURES.keys(),
                                       message="⚠️ Please upload an image for DR prediction.")

            file = request.files["file"]
            if not allowed_file(file.filename):
                return render_template("index.html", features=DN_FEATURES.keys(),
                                       message="⚠️ Invalid file type! Only PNG, JPG, JPEG allowed.")

            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(file_path)

            dr_result = predict_retinopathy(file_path)

        # Process DN prediction if selected
        if predict_dn:
            try:
                features = [float(request.form[key]) for key in DN_FEATURES.keys() if request.form[key]]
            except ValueError:
                return render_template("index.html", features=DN_FEATURES.keys(),
                                       message="⚠️ Invalid input! Please enter numeric values.")

            input_df = pd.DataFrame([features], columns=[key for key in DN_FEATURES.keys() if request.form[key]])
            dn_result = predict_nephropathy(input_df)

        # Store results for report
        latest_prediction = f"{dr_result or 'N/A'}, {dn_result or 'N/A'}"
        latest_image_path = file_path if predict_dr else None
        latest_dn_params = ", ".join([f"{key}: {request.form[key]}" for key in DN_FEATURES.keys() if request.form[key]])

        return render_template("result.html",
                               dr_result=dr_result,
                               dn_result=dn_result,
                               image_path=file_path or "",
                               dn_parameters=latest_dn_params)

    return render_template("index.html", features=DN_FEATURES.keys())

# Find Doctors Route
@app.route("/find_doctors")
def find_doctors():
    return """<script>window.open("https://www.google.com/maps/search/Diabetic+Retinopathy+and+Nephropathy+Specialist+Doctor+Near+Me/", "_blank");</script>"""

# Generate PDF Report
@app.route("/download_report")
def download_report():
    if latest_prediction and latest_image_path:
        # Generate an accessible image URL
        image_url = f"{request.host_url}static/uploads/{os.path.basename(latest_image_path)}"
        
        # Format DN parameters vertically with proper styling
        dn_params_html = ""
        if latest_dn_params and "," in latest_dn_params:
            params_list = latest_dn_params.split(",")
            dn_params_html = """
            <h3 style="margin-top: 20px; color: #3498db;">Clinical Parameters</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Parameter</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Value</th>
                </tr>
            """
            
            for param in params_list:
                if ":" in param:
                    key, value = param.strip().split(":", 1)
                    dn_params_html += f"""
                    <tr>
                        <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">{key}</td>
                        <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">{value}</td>
                    </tr>
                    """
            
            dn_params_html += "</table>"

        # Create a more structured and styled PDF report
        pdf_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Medical Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }}
                h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                h3 {{ color: #3498db; margin-top: 20px; }}
                .header {{ display: flex; justify-content: space-between; margin-bottom: 20px; }}
                .prediction {{ margin: 15px 0; padding: 10px; border-left: 4px solid #3498db; background-color: #f8f9fa; }}
                .date {{ color: #7f8c8d; }}
                .footer {{ margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #7f8c8d; }}
                .note {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 20px; }}
                img {{ max-width: 100%; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <h1>Diabetic Complication Assessment Report</h1>
            
            <div class="header">
                <div>
                    <p><b>Patient ID:</b> {datetime.now().strftime("%Y%m%d%H%M")}</p>
                </div>
                <div class="date">
                    <p><b>Date:</b> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
            </div>
            
            <h3>Diagnostic Results</h3>
            <div class="prediction">
                <p><b>Retinopathy Status:</b> {latest_prediction.split(',')[0]}</p>
                <p><b>Nephropathy Status:</b> {latest_prediction.split(',')[1]}</p>
            </div>
            
            {dn_params_html}
            
            <h3>Retinal Image Analysis</h3>
            <img src="{image_url}" style="max-width: 500px;">
            
            <div class="note">
                <p><b>Note:</b> This assessment is generated by an AI system and should be reviewed by a healthcare professional. 
                For accurate diagnosis and treatment, please consult with a certified ophthalmologist or nephrologist.</p>
            </div>
            
            <div class="footer">
                <p>Generated by DiabCare AI - Advanced Diabetic Complication Assessment System</p>
                <p>© {datetime.now().year} DiabCare AI. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        pdf_path = os.path.join(app.config["REPORTS_FOLDER"], f"diabetic_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf")
        pdfkit.from_string(pdf_content, pdf_path, configuration=PDFKIT_CONFIG)
        return send_file(pdf_path, as_attachment=True)

    return "No prediction available yet. Please upload an image first."

# Run Flask App
if __name__ == "__main__":
    app.run(debug=True)
