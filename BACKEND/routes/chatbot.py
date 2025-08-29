import os
import google.generativeai as genai
from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint('chatbot_bp', __name__)

# --- CONFIGURE THE GEMINI AI MODEL ---
chat = None
try:
    # Load the API key from your .env file
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file. Please check your configuration.")
    genai.configure(api_key=GOOGLE_API_KEY)
    
    # Create the model with a system instruction to keep it on topic
    model = genai.GenerativeModel(
        model_name='gemini-1.5-flash',
        system_instruction="You are a friendly and helpful AI assistant for a web application that detects spinal tumors from MRI scans. The application was created by Venmugil Sruthi and Vidhi Pant. Your goal is to answer user questions about the application, spinal health, and medical imaging. Keep your answers concise and helpful. If a user asks a question completely unrelated to these topics, politely guide them back to the application's purpose."
    )
    # Start a chat session to maintain conversation history
    chat = model.start_chat(history=[])
    print("✅ Gemini AI Model for chatbot initialized successfully.")
    
except Exception as e:
    print(f"❌ ERROR: Failed to initialize Gemini AI Model: {e}")
    # The 'chat' variable will remain None, which we handle below.

@chatbot_bp.route('/ask', methods=['POST'])
def ask_chatbot():
    # Check if the AI model failed to initialize during startup
    if not chat:
        return jsonify({"answer": "I'm sorry, my AI brain is currently offline. Please check the server configuration and API key."}), 500
        
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "No question provided."}), 400

    question = data['question'].strip()
    
    try:
        # --- SEND QUESTION TO GEMINI AI ---
        response = chat.send_message(question)
        answer = response.text
        
    except Exception as e:
        print(f"❌ ERROR: Gemini API call failed: {e}")
        answer = "I'm sorry, I seem to be having a bit of trouble thinking right now. Please try asking your question again."
            
    return jsonify({"answer": answer})

