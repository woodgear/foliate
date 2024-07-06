import { readJSONFile, writeJSONFile, getEnv } from "./util.js";

export const reg_events = function () {
    return ["hunter"]
}

export const handle_events = function (name, payload) {
    console.log("hunter", name, payload)
    if (name === "hunter") {
        hunter(payload)
    }
}
export const hunter = function (payload) {
    console.log("------> hunter", getEnv("FOLIATE_ENG"))
    const eng_file = getEnv("FOLIATE_ENG")
    const eng = readJSONFile(eng_file)
    if (!!!eng["word"]) {
        eng["word"] = []
    }
    if (!!!eng["sentence"]) {
        eng["sentence"] = []
    }
    const { selected, sentence } = payload
    if (selected.length == 0) {
        return
    }
    console.log("------> hunter", selected, sentence)
    eng["word"] = eng["word"].concat(payload["selected"])
    eng["sentence"].push(payload["sentence"])
    writeJSONFile(eng_file, eng)
}
function clean_text(input) {
    const invisibleChars = /[\x00-\x1F\x7F-\x9F\u2000-\u200F\u2028\u2029\u202A-\u202E\u2060-\u206F\uFEFF]/g;
    // 使用空格替换所有不可见字符
    return input.replace(invisibleChars, ' ');
}
export const gen_hunter_tool = function () {
    return {
        label: "hunter",
        run: ({ text, meta }) => {
            text = clean_text(text)
            console.log("hunter", text, meta)
            const meta_str = JSON.stringify(meta)
            console.log("meta_str", meta_str);
            const out = `
<style>
    body {
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 20px;
    }

    main {
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: 10px;
        margin-top: 20px;
    }

    #park {
        border: 1px solid black;
    }

    #actionbar {
        border: 1px solid red;
    }

    .word {
        padding: 0px 5px;
        cursor: pointer;
        display: inline-block;
        border: 1px dashed gray;
        border-radius: 10px;
        background-color: lightgray;
        text-align: center;
        margin: 5px;
    }

    .selector {
        display: inline-block;
        border: 1px solid;
        background-color: #2e8dde;
        color: white;
        line-height: 3em;
        text-align: center;
    }

    .selected {
        background-color: #2e8dde;
        color: white;
    }
    .draggable {
        background-color: lightgray;
    }
</style>
<main>
    <div id="park">
    </div>
    <div id="actionbar">
        <button id="hunter">hunter</button>
    </div>
</main>
<script>
    document.body.dataset.state = 'loading'

    const park = document.querySelector('#park');
    const sentence = "${text}";

    const guard = document.createElement('div');
    guard.className = "guard"
    guard.textContent = "   ";

    const s = document.createElement('div');
    s.id = "s"
    s.className = "selector"
    s.draggable = true
    s.textContent = "S";
    const e = document.createElement('div');
    e.id = "e"
    e.className = "selector"
    e.draggable = true
    e.textContent = "E";

    park.appendChild(s);
    sentence.split(" ").forEach(word => {
        const w = document.createElement('div');
        w.textContent = word;
        w.className = "word"
        w.addEventListener('click', (e) => {
            if (e.shiftKey) {
                if (draggclick=="") {
                    return
                }
                const sel=document.getElementById(draggclick)
                e.target.after(sel)
                return
            }
            if (e.target.className.includes("selected")) {
                e.target.className = e.target.className.replace(" selected", "")
                return
            }
            e.target.className += " selected"
        });
        park.appendChild(w);
    });
    park.appendChild(e);

    const hunter = document.querySelector('#hunter');
    function getSelected() {
        const ws = document.querySelectorAll('.selected');
        return Array.from(ws).map(e => e.textContent);
    }
    function getSentence() {
        const ws = document.querySelectorAll('.word, #s, #e');
        const sentence = []
        let nots = true
        for (let [i, e] of ws.entries()) {
            if (e.id != "s" && nots) {
                continue
            }
            nots=false
            if (e.id == "s") {
                continue
            }
            if (e.id == "e") {
                break
            }
            sentence.push(e.textContent)
        }
        return sentence.join(" ");
    }
    const meta_str='${meta_str}'
    hunter.addEventListener('click', () => {
        const ret={
            "type":"hunter",
            "payload": {
                "selected": getSelected(),
                "sentence": {
                   "sentence": getSentence(),
                   "origin": JSON.parse(meta_str)
                }
            }
        }
        window.webkit.messageHandlers.event.postMessage(JSON.stringify(ret));
    });

    const buttons = document.querySelectorAll('.word,.guard, #s, #e');
    let dragged;
    let draggclick = "";
    [s, e].forEach(x => {
        x.addEventListener('click', event => {
            const id= event.target.id
            if (draggclick == id) {
                draggclick = ""
            }else {
                draggclick = id
            }
        })
    });

    [s, e].forEach(draggable => {
        draggable.addEventListener('dragstart', (event) => {
            dragged = event.target;
            event.target.style.opacity = 0.5;
        });

        draggable.addEventListener('dragend', (event) => {
            event.target.style.opacity = "";
        });
    });
    const isTarget = (event) => {
        return event.target.classList.contains('word') || event.target === sButton || event.target === eButton
    }
    buttons.forEach(button => {
        button.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        button.addEventListener('dragenter', (event) => {
            if (!isTarget(event)) {
                return
            }

            event.target.style.borderRight = '2px solid red';

        });

        button.addEventListener('dragleave', (event) => {
            if (!isTarget(event)) {
                return
            }
            event.target.style.borderRight = '';

        });

        button.addEventListener('drop', (event) => {
            event.preventDefault();
            if (!isTarget(event)) {
                return
            }
            event.target.style.borderRight = '';
            if (dragged == event.target) {
                return
            }

            if (dragged.id === 's' && event.target.id === 'e') {
                // 禁止将 s 拖动到 e 后面
                return
            }
            event.target.after(dragged);
        });
    });

    document.body.dataset.state = 'loaded'
</script>
            `
            // console.log(out)
            return out;
        }
    }
}