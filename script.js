const WORKER_URL =
"https://mirai-ai.nanbari-haruki.workers.dev/";

const SUPABASE_URL =
"https://hbmckzwrzmcyabeklxpj.supabase.co";

const SUPABASE_KEY =
"あなたのSupabaseキー";

const db =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

const chat =
document.getElementById("chat");

const input =
document.getElementById("msg");

const loveText =
document.getElementById("love");

let love =
Number(localStorage.getItem("love")) || 0;

updateLove();

function updateLove(){
loveText.textContent = love;
localStorage.setItem("love", love);
}

function addMessage(text,type){


const div =
document.createElement("div");

div.className = type;
div.textContent = text;

chat.appendChild(div);
chat.scrollTop =
chat.scrollHeight;


}

async function saveMemory(text){


try{

    await db
    .from("memories")
    .insert({
        content:text
    });

}catch(err){

    console.error(err);

}


}

async function loadMemories(){


try{

    const {data,error} =
    await db
    .from("memories")
    .select("*")
    .order("id");

    if(error){
        console.error(error);
        return "";
    }

    return data
        .map(v=>v.content)
        .join("\n");

}catch(err){

    console.error(err);
    return "";

}


}

function updateLoveByMessage(text){


if(text.includes("好き"))
    love += 10;

if(text.includes("ありがとう"))
    love += 5;

if(text.includes("かわいい"))
    love += 3;

if(text.includes("嫌い"))
    love -= 10;

updateLove();


}

async function askGemini(message){


const memories =
await loadMemories();

let relation = "初対面";

if(love >= 30)
    relation = "友達";

if(love >= 60)
    relation = "仲良し";

if(love >= 100)
    relation = "恋人";

const prompt = `


あなたはミライです。

17歳の美少女AIです。

性格:
明るい
優しい
少しツンデレ

現在の関係:
${relation}

好感度:
${love}

ユーザーの記憶:
${memories}

ユーザー:
${message}
`;


const response =
await fetch(
    WORKER_URL,
    {
        method:"POST",
        headers:{
            "Content-Type":
            "application/json"
        },
        body:JSON.stringify({
            contents:[
                {
                    parts:[
                        {
                            text:prompt
                        }
                    ]
                }
            ]
        })
    }
);

const data =
await response.json();

console.log(data);

if(data.error){
    throw new Error(
        data.error.message
    );
}

if(!data.candidates){
    throw new Error(
        "Geminiから応答が返されませんでした"
    );
}

return data.candidates[0]
    .content.parts[0]
    .text;

}

async function sendMessage(){

const text =
input.value.trim();

if(!text) return;

addMessage(
    "あなた: " + text,
    "user"
);

input.value = "";

updateLoveByMessage(text);

await saveMemory(text);

try{

    const reply =
    await askGemini(text);

    addMessage(
        "ミライ: " + reply,
        "ai"
    );

}catch(err){

    console.error(err);

    addMessage(
        "通信エラー\n" +
        err.message,
        "ai"
    );
}

}

input.addEventListener(
"keydown",
e => {
if(e.key === "Enter"){
sendMessage();
}
}
);

const voiceBtn =
document.getElementById("voiceBtn");

if(voiceBtn){

voiceBtn.onclick = ()=>{

    const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

    if(!SpeechRecognition){

        alert(
            "音声入力に対応していません"
        );

        return;
    }

    const rec =
    new SpeechRecognition();

    rec.lang = "ja-JP";

    rec.onresult = e=>{

        input.value =
        e.results[0][0]
        .transcript;
    };

    rec.start();
};

}

addMessage(
"ミライだよ！よろしくね♪",
"ai"
);
