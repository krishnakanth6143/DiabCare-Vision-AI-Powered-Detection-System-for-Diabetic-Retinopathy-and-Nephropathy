# DiabCare: AI-Powered Detection System for Diabetic Retinopathy and Nephropathy


![image](https://github.com/user-attachments/assets/d89e45c3-59f8-49aa-b020-bf45bbe3e09f)
![image](https://github.com/user-attachments/assets/84af051b-e230-41ec-b40b-56cfacefbf54)
![image](https://github.com/user-attachments/assets/e05836b0-bfb3-491e-8453-d83365bcb5a0)




## Overview

DiabCare is an advanced AI-powered web application designed to detect and classify diabetic complications, specifically diabetic retinopathy and nephropathy, utilizing state-of-the-art deep learning and machine learning algorithms. The system combines computer vision models for retinal image analysis with ensemble machine learning approaches for predicting kidney complications based on medical parameters.

![image](https://github.com/user-attachments/assets/0a9589a3-0fa0-4017-9998-447a84b1f90b)
![image](https://github.com/user-attachments/assets/888c9d5b-3771-4033-aa98-eaa7700205e7)



## Features

- **Retinal Disease Detection**: Accurately classifies different stages of diabetic retinopathy (No DR, Mild, Moderate, Severe, Proliferate DR) and other retinal conditions using advanced image analysis
- **Nephropathy Prediction**: Assesses kidney complication risks based on clinical parameters like age, diabetes duration, blood pressure, etc.
- **Explainable Results**: Provides transparent and interpretable AI explanations for diagnoses
- **User-Friendly Interface**: Interactive web application for uploading retinal images and inputting medical parameters
- **AI-Assisted Chatbot**: Built-in assistant to help users understand their results and provide guidance

## Technologies Used

### Computer Vision Models
- **Swin Transformer**: Hierarchical feature extraction through shifted window self-attention for retinal image classification
- **Vision Transformer (ViT)**: Transformer-based architecture for image analysis
- **ResNet50**: Deep residual network architecture for image classification

### Machine Learning Models
- **Random Forest**: Ensemble learning method for analyzing patient parameters
- **XGBoost**: Gradient boosting algorithm for nephropathy risk prediction

### Explainable AI
- **SHAP (SHapley Additive Explanations)**: Provides transparency on feature importance
- **LIME (Local Interpretable Model-agnostic Explanations)**: Explains individual predictions

### Web Development
- **Flask**: Python web framework for backend implementation
- **HTML/CSS/JavaScript**: Frontend development
- **Responsive Design**: Cross-device compatibility

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/krishnakanth6143/DiabCare-Vision-AI-Powered-Detection-System-for-Diabetic-Retinopathy-and-Nephropathy.git
   cd DiabCare-Vision-AI-Powered-Detection-System-for-Diabetic-Retinopathy-and-Nephropathy
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   # For Windows
   venv\Scripts\activate
   # For macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Access the web application at `http://localhost:5000`

## Project Structure

- `app.py`: Main Flask application entry point
- `Diabetic_retinopathy.ipynb`: Jupyter notebook for retinopathy model development
- `Diabetic_nephropathy.ipynb`: Jupyter notebook for nephropathy model development
- `Model/`: Contains trained AI models
  - `diabetic_retinopathy_resnet50.pth`: ResNet50 model for retinopathy classification
  - `diabetic_retinopathy_vit.pth`: Vision Transformer model for retinopathy classification
  - `random_forest_diabetic_nephropathy.pkl`: Random Forest model for nephropathy prediction
  - `xgboost_diabetic_nephropathy.pkl`: XGBoost model for nephropathy prediction
  - `scaler.pkl`: Data scaling model for feature normalization
- `templates/`: HTML templates for web interface
- `static/`: Static assets (CSS, JavaScript, images)
- `dataset/`: Training and testing datasets

## Usage

1. Navigate to the home page to learn about the system
2. Access the prediction tool from the navigation menu
3. For retinopathy detection:
   - Upload a retinal fundus image
   - Click "Analyze Image" to receive a classification
4. For nephropathy prediction:
   - Input the required clinical parameters
   - Submit the form to receive a risk assessment
5. Review the AI-generated report and explanations
6. Use the chatbot for additional guidance or questions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
- GitHub: [krishnakanth6143](https://github.com/krishnakanth6143)

---

© 2025 DiabCare AI. All rights reserved.
