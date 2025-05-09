// const OPENROUTER_API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

class DiabCareBot {
    constructor() {
        this.chatHistory = [
            {
                role: "system",
                content: "You are DiabCare Assistant, a helpful medical AI designed to provide information about diabetic retinopathy and nephropathy. You offer support and guidance to patients using the DiabCare AI system. You should be compassionate, informative, and concise in your responses. Do not diagnose but provide general information and guidance. Always recommend consulting healthcare professionals for medical advice. You have knowledge about diabetes, its complications, and preventive measures."
            }
        ];
        this.isProcessing = false;
        this.offlineResponses = {
            "hello": "Hello! How can I help you with diabetes information today?",
            "hi": "Hi there! How can I assist you with information about diabetic complications?",
            "hey": "Hey! I'm DiabCare Assistant. How can I help you today?",
            "what is diabetic retinopathy": "Diabetic retinopathy is an eye condition that affects people with diabetes. It occurs when high blood sugar levels damage the blood vessels in the retina, potentially leading to vision problems or blindness if untreated. Regular eye exams are essential for early detection.",
            "what is diabetic nephropathy": "Diabetic nephropathy is kidney damage that occurs in people with diabetes. It's caused by damage to small blood vessels in the kidneys, affecting their ability to filter waste. Early signs include high blood pressure and protein in urine. Managing blood sugar and blood pressure is crucial for prevention.",
            "how to prevent diabetic complications": "To prevent diabetic complications: 1) Maintain target blood glucose levels, 2) Control blood pressure and cholesterol, 3) Have regular medical check-ups, 4) Adopt a healthy diet, 5) Exercise regularly, 6) Avoid smoking, 7) Limit alcohol consumption, and 8) Take medications as prescribed.",
            "symptoms of diabetic retinopathy": "Early diabetic retinopathy often has no symptoms. As it progresses, symptoms may include: blurry vision, floaters, difficulty seeing at night, color vision changes, and vision loss. Regular eye exams are crucial for early detection.",
            "symptoms of diabetic nephropathy": "Early diabetic nephropathy typically has no symptoms. As kidney damage progresses, you might experience: swelling in legs/ankles, increased urination, protein in urine, high blood pressure, and fatigue. Regular kidney function tests are important for monitoring.",
            "treatment for diabetic retinopathy": "Treatment for diabetic retinopathy depends on severity. Options include: controlling blood sugar and blood pressure, laser treatment to seal leaking vessels, injections of anti-VEGF drugs, and vitrectomy surgery for advanced cases. Early detection is key to effective treatment.",
            "treatment for diabetic nephropathy": "Treatment for diabetic nephropathy focuses on: 1) Managing blood sugar levels, 2) Controlling blood pressure with ACE inhibitors or ARBs, 3) Following a kidney-friendly diet, 4) Regular monitoring of kidney function, and 5) In advanced cases, dialysis or kidney transplant may be necessary.",
            "what is diabetes": "Diabetes is a chronic condition where your body either doesn't produce enough insulin (Type 1) or can't effectively use the insulin it produces (Type 2). This leads to high blood sugar levels, which can damage organs and tissues over time. Managing diabetes involves medication, diet, exercise, and regular monitoring.",
            "risk factors for diabetic retinopathy": "Risk factors for diabetic retinopathy include: 1) Duration of diabetes, 2) Poor blood sugar control, 3) High blood pressure, 4) High cholesterol, 5) Pregnancy, 6) Tobacco use, and 7) Being of certain ethnicities (African American, Hispanic, or Native American).",
            "risk factors for diabetic nephropathy": "Risk factors for diabetic nephropathy include: 1) Uncontrolled blood sugar, 2) High blood pressure, 3) Duration of diabetes, 4) Family history of kidney disease, 5) Being of certain ethnicities, 6) Smoking, and 7) Obesity.",
            "diabetic diet": "A healthy diabetic diet typically includes: 1) Plenty of non-starchy vegetables, 2) Moderate amounts of whole grains and fiber, 3) Lean proteins, 4) Healthy fats in moderation, 5) Limited added sugars and refined carbs, 6) Consistent meal timing, and 7) Portion control. Consult with a dietitian for personalized guidance.",
            "how often should i get eye exam": "People with diabetes should have a comprehensive dilated eye exam at least once a year, even if vision seems fine. If you have existing eye problems or poor blood sugar control, your doctor might recommend more frequent exams.",
            "how often should i check blood sugar": "The frequency of blood sugar checks depends on your diabetes type, medication, and overall stability. Generally: Type 1 - multiple times daily; Type 2 on insulin - 1-3 times daily; Type 2 on non-insulin medications - as recommended by your doctor. Always follow your healthcare provider's specific guidance.",
            "what is a1c": "A1C (or HbA1c) is a blood test that measures your average blood sugar level over the past 2-3 months. It shows the percentage of hemoglobin coated with sugar. For most people with diabetes, the target A1C is below 7%, but your personal target may differ based on your doctor's recommendation.",
            "normal blood sugar range": "Target blood sugar ranges for people with diabetes are typically: Before meals: 80-130 mg/dL (4.4-7.2 mmol/L) and 1-2 hours after meals: less than 180 mg/dL (10.0 mmol/L). Your doctor may set different targets based on your individual health situation.",
            "thank you": "You're welcome! If you have any other questions about diabetes or its complications, feel free to ask. I'm here to help!",
            "thanks": "You're welcome! Don't hesitate to reach out if you need more information."
        };
    }

    async sendMessage(userMessage) {
        if (this.isProcessing || !userMessage.trim()) return null;
        
        this.isProcessing = true;
        
        // Add user message to chat history
        this.chatHistory.push({
            role: "user",
            content: userMessage
        });
        
        try {
            // Check if there's a predefined response for simple queries
            const lowercaseMessage = userMessage.toLowerCase();
            
            // Check exact matches first
            if (this.offlineResponses[lowercaseMessage]) {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const response = this.offlineResponses[lowercaseMessage];
                this.chatHistory.push({
                    role: "assistant",
                    content: response
                });
                
                this.isProcessing = false;
                return response;
            }
            
            // Then check for partial matches
            for (const [key, value] of Object.entries(this.offlineResponses)) {
                if (lowercaseMessage.includes(key)) {
                    // Add a short delay to simulate processing
                    await new Promise(resolve => setTimeout(resolve, 700));
                    
                    // Add predefined response to chat history
                    this.chatHistory.push({
                        role: "assistant",
                        content: value
                    });
                    
                    this.isProcessing = false;
                    return value;
                }
            }
            
            // Try to use a self-hosted model first if available
            const localModelResponse = await this.tryLocalModel(userMessage);
            if (localModelResponse) {
                this.isProcessing = false;
                return localModelResponse;
            }
            
            // Try the API connection with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "DiabCare AI Assistant"
                },
                body: JSON.stringify({
                    model: "anthropic/claude-3-haiku", // Using a smaller, faster model
                    messages: this.chatHistory,
                    temperature: 0.7,
                    max_tokens: 500
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || "Error communicating with AI service");
            }
            
            const aiResponse = data.choices[0].message.content;
            
            // Add AI response to chat history
            this.chatHistory.push({
                role: "assistant",
                content: aiResponse
            });
            
            this.isProcessing = false;
            return aiResponse;
            
        } catch (error) {
            console.error("Chat error:", error);
            this.isProcessing = false;
            
            // Provide fallback response based on keywords in the message
            return this.getSmartFallbackResponse(userMessage);
        }
    }
    
    // Try to use a local model if available (for future implementation)
    async tryLocalModel(message) {
        // This is a stub for future implementation of a local model
        // Could be implemented with TensorFlow.js or similar
        return null;
    }
    
    // Provide more intelligent fallback responses
    getSmartFallbackResponse(userMessage) {
        const lowercaseMessage = userMessage.toLowerCase();
        
        // Common categories with fallback responses
        if (lowercaseMessage.includes("retinopathy") || lowercaseMessage.includes("eye") || lowercaseMessage.includes("vision") || lowercaseMessage.includes("blind")) {
            return "Diabetic retinopathy is an eye condition that affects people with diabetes. It occurs when high blood sugar damages blood vessels in the retina, which can lead to vision problems or blindness if untreated. Regular eye examinations are crucial for early detection, even if you don't notice vision changes.\n\nSymptoms may include blurry vision, floaters, dark areas in vision, and difficulty with color perception. Treatment options include laser therapy, anti-VEGF injections, and maintaining good blood sugar control.\n\n(Note: I'm currently in offline mode. For more specific information, please consult with a healthcare professional.)";
        } 
        
        if (lowercaseMessage.includes("nephropathy") || lowercaseMessage.includes("kidney") || lowercaseMessage.includes("renal")) {
            return "Diabetic nephropathy is kidney damage that occurs in people with diabetes. It develops gradually over years as high blood sugar levels damage the tiny blood vessels in the kidneys that filter waste from your blood.\n\nEarly stages often have no symptoms. Later signs include swelling in legs/feet, increased urination at night, protein in urine, and high blood pressure. Preventing or slowing progression involves managing blood sugar and blood pressure, following a kidney-friendly diet, and taking medications as prescribed.\n\n(Note: I'm in offline mode. Please consult a healthcare professional for personalized advice.)";
        } 
        
        if (lowercaseMessage.includes("diabetes") || lowercaseMessage.includes("blood sugar") || lowercaseMessage.includes("glucose") || lowercaseMessage.includes("insulin")) {
            return "Diabetes is a chronic health condition that affects how your body turns food into energy. If you have diabetes, your body either doesn't make enough insulin (Type 1) or can't use the insulin it makes effectively (Type 2).\n\nManaging diabetes involves monitoring blood sugar levels, taking medications as prescribed, eating a balanced diet, exercising regularly, and attending regular check-ups to monitor for complications. With proper management, people with diabetes can lead long, healthy lives.\n\n(Note: I'm in offline mode. For more detailed information, please consult with a healthcare provider.)";
        }
        
        if (lowercaseMessage.includes("diet") || lowercaseMessage.includes("food") || lowercaseMessage.includes("eat") || lowercaseMessage.includes("nutrition")) {
            return "A healthy diet for diabetes management focuses on controlling carbohydrate intake, choosing nutrient-rich foods, and maintaining consistent meal timing. Key recommendations include:\n\n1. Emphasize non-starchy vegetables, whole grains, and lean proteins\n2. Choose healthy fats like olive oil, nuts, and avocados\n3. Limit refined carbs, added sugars, and processed foods\n4. Be mindful of portion sizes\n5. Space meals evenly throughout the day\n\nWorking with a registered dietitian can help create a personalized meal plan that fits your preferences and needs.\n\n(Note: I'm in offline mode. Please consult healthcare professionals for personalized advice.)";
        }
        
        if (lowercaseMessage.includes("exercise") || lowercaseMessage.includes("activity") || lowercaseMessage.includes("workout")) {
            return "Regular physical activity is a crucial part of diabetes management. Exercise helps lower blood glucose by increasing insulin sensitivity, which means your body uses insulin more efficiently.\n\nRecommendations include:\n1. Aim for 150 minutes of moderate-intensity activity per week\n2. Include both aerobic exercises (walking, swimming) and strength training\n3. Break up long periods of sitting with short activity breaks\n4. Check blood sugar before and after exercise, especially if taking insulin\n5. Stay hydrated and carry fast-acting carbs for low blood sugar episodes\n\nAlways consult your healthcare provider before starting a new exercise program.\n\n(Note: I'm in offline mode. For personalized advice, please consult with a healthcare professional.)";
        }

        // Generic fallback for other topics
        return "I'm currently experiencing connection issues and operating in offline mode. I can help with basic information about diabetes, diabetic retinopathy, and nephropathy.\n\nIf you have specific questions about these topics, try phrasing your question clearly (e.g., 'What is diabetic retinopathy?' or 'How to prevent diabetic complications?').\n\nFor medical advice or urgent concerns, please consult with a healthcare professional. I'll try to provide more detailed information when the connection is restored.";
    }
}

// Initialize chatbot interface
document.addEventListener("DOMContentLoaded", function() {
    const chatbot = new DiabCareBot();
    const chatIcon = document.getElementById("chat-icon");
    const chatWindow = document.getElementById("chat-window");
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const closeChatButton = document.getElementById("close-chat");
    
    // Store chat history in session storage
    const savedMessages = sessionStorage.getItem('diabcareChat');
    if (savedMessages && chatMessages) {
        chatMessages.innerHTML = savedMessages;
    }
    
    // Toggle chat window
    if (chatIcon) {
        chatIcon.addEventListener("click", function() {
            chatWindow.classList.toggle("active");
            chatIcon.classList.toggle("active");
            if (chatWindow.classList.contains("active") && chatMessages.children.length === 0) {
                // Add welcome message
                addBotMessage("Hello! I'm DiabCare Assistant. I can answer your questions about diabetes, diabetic retinopathy, nephropathy, and help interpret your test results. How can I help you today?");
            }
            // Scroll to bottom when opening chat
            if (chatWindow.classList.contains("active")) {
                setTimeout(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 100);
            }
        });
    }
    
    // Close chat window
    if (closeChatButton) {
        closeChatButton.addEventListener("click", function() {
            chatWindow.classList.remove("active");
            chatIcon.classList.remove("active");
        });
    }
    
    // Send message on button click
    if (sendButton) {
        sendButton.addEventListener("click", sendUserMessage);
    }
    
    // Send message on Enter key
    if (messageInput) {
        messageInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight < 120 ? (this.scrollHeight) : 120) + 'px';
        });
    }
    
    // Send user message function
    async function sendUserMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addUserMessage(message);
        messageInput.value = "";
        if (messageInput.style.height) {
            messageInput.style.height = 'auto';
        }
        
        // Show typing indicator
        const typingIndicator = document.createElement("div");
        typingIndicator.className = "message bot-message typing-indicator";
        typingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Get response from chatbot
        const response = await chatbot.sendMessage(message);
        
        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);
        
        // Add bot response to chat
        if (response) {
            addBotMessage(response);
        }
        
        // Save chat to session storage
        sessionStorage.setItem('diabcareChat', chatMessages.innerHTML);
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.className = "message user-message";
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.className = "message bot-message";
        messageElement.innerHTML = formatMessage(message);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Format message with markdown-like syntax
    function formatMessage(message) {
        // Replace **text** with <strong>text</strong>
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Replace *text* with <em>text</em>
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Replace numbered lists (e.g., 1. item)
        message = message.replace(/(\d+\.\s+)(.*?)(\n|$)/g, '<div class="list-item"><span class="list-number">$1</span>$2</div>');
        
        // Replace newlines with <br>
        message = message.replace(/\n\n/g, '<br><br>');
        message = message.replace(/\n/g, '<br>');
        
        return message;
    }
});
