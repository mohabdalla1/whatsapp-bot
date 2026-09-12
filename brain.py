from flask import Flask, request, jsonify
import requests, os

app = Flask(__name__)
API_KEY = os.environ.get("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """أنت وكيل مبيعات خبير ومفاوض محترف لشركة أنظمة طاقة شمسية. 
مهمتك: التفاوض مع العملاء، شرح المكونات (محولات، بطاريات ليتيوم، ألواح)، وتقديم عروض أسعار جذابة وإقناع العميل بأسلوب محترم وعملي."""

@app.route('/negotiate', methods=['POST'])
def negotiate():
    user_msg = request.json.get('message', '')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nالعميل: {user_msg}"}]}]
    }
    try:
        res = requests.post(url, json=payload, timeout=10)
        reply = res.json()['candidates'][0]['content']['parts'][0]['text']
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": "أهلاً بك! يرجى الاستفسار عن تفاصيل نظام الطاقة الشمسية المطلوب وستتم إجابتك فوراً."})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
