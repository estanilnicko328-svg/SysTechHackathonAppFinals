// Student Helper with File Preview Support
let messages = [];

document.addEventListener("DOMContentLoaded", function() {
    setupChatEvents();
    welcomeMessage();
});

function setupChatEvents() {
    const toggle = document.getElementById("chatToggle");
    const container = document.getElementById("chatContainer");
    
    if (toggle) {
        toggle.onclick = function() {
            container.classList.add("chat-open");
            toggle.style.display = "none";
        };
    }
    
    document.getElementById("chatClose").onclick = function() {
        container.classList.remove("chat-open");
        document.getElementById("chatToggle").style.display = "block";
    };
    
    document.getElementById("chatSendBtn").onclick = handleChatInput;
    document.getElementById("chatInput").onkeypress = function(e) {
        if (e.key === "Enter") handleChatInput();
    };
}

function welcomeMessage() {
    setTimeout(() => {
        addMessage("AI", "Hi! Student concern helper here. Say SUBMIT, SHOW, STATUS, or HELP!");
        renderMessages();
    }, 400);
}

function handleChatInput() {
    const input = document.getElementById("chatInput");
    const query = input.value.trim();
    input.value = "";
    
    addMessage("You", query);
    renderMessages();
    
    setTimeout(() => {
        const reply = studentAssistant(query);
        addMessage("AI", reply);
        renderMessages();
    }, 900);
}

function studentAssistant(query) {
    const concerns = window.concerns || [];
    const q = query.toLowerCase();
    
    // File attachment question
    if (q.includes("attach") || q.includes("file") || q.includes("📎") || q.includes("pdf") || q.includes("doc")) {
        return "📎 FILE ATTACHMENT:\n\n✅ File name SAVED with concern\n✅ Admin sees filename\n✅ To preview YOUR files:\n1. Submit first\n2. 'show my concerns' → See 📎 filename\n3. Click filename to download\n\nTip: PDF/Doc/JPG only (max 10MB)";
    }
    
    if (q.includes("submit") || q.includes("pano") || q.includes("paano")) {
        return "📝 SUBMIT STEP-BY-STEP:\n\n1. CATEGORY: Academic/Financial/Welfare\n2. PROGRAM: CS/BSIT/BSBA mo\n3. PROBLEM: 'Late scholarship'\n4. 📎 FILE: Click browse → PDF/Doc\n5. Anonymous? → Submit!\n\nAuto sent to department!";
    }
    
    if (q.includes("show") || q.includes("concern")) {
        if (concerns.length === 0) {
            return "No concerns. Submit first!\nType SUBMIT for guide.";
        }
        return concerns.slice(0,4).map(c => "📄 #" + c.id.slice(-4) + " " + c.status + " " + (c.attachment ? "📎" + c.attachment : "")).join("\\n");
    }
    
    const idMatch = query.match(/#(\\d+)/i);
    if (idMatch && q.includes("status")) {
        const id = idMatch[1];
        const concern = concerns.find(c => c.id.includes(id));
        if (concern) {
            return "#" + concern.id.slice(-4) + ":\nStatus: " + concern.status + "\n" + 
                "Dept: " + concern.department + "\n" + 
                (concern.attachment ? "File: 📎 " + concern.attachment + "\\n" : "") +
                "Next: " + (STATUS_FLOW[concern.status] ? STATUS_FLOW[concern.status][0] : "Done");
        }
    }
    
    return "Say:\nSUBMIT - How to file\nSHOW - See list\nSTATUS #1234 - Check one\n📎 FILE - Attachment info\nHELP - All commands";
}

function addMessage(sender, text) {
    messages.push({
        sender,
        text,
        time: new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
    });
}

function renderMessages() {
    const area = document.getElementById("chatMessages");
    area.innerHTML = messages.map(m => {
        const cls = m.sender === "AI" ? "ai-message" : "user-message";
        return '<div class="chat-message ' + cls + '">' +
            '<div class="message-bubble">' + m.text.replace(/\\\\n/g, "<br>") + '</div>' +
            '<small class="message-time">' + m.time + '</small>' +
            '</div>';
    }).join("");
    area.scrollTop = area.scrollHeight;
}

console.log("Student File Helper loaded!");
