document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('forms-container');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusMsg = document.getElementById('status-msg');

    const categories = ["C1_Question", "C2_Question", "C3_Question", "C4_Question"];

    let loadedQuestions = {};
    try {
        const stored = localStorage.getItem('customQuestions');
        if (stored) {
            loadedQuestions = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error loading saved questions", e);
    }

    container.innerHTML = '';

    categories.forEach(cat => {
        const section = document.createElement('section');
        section.className = 'category-section';
        
        const catHeader = document.createElement('h2');
        catHeader.textContent = `Category: ${cat.replace('_', ' ')}`;
        catHeader.style.borderBottom = "2px solid #ddd";
        catHeader.style.paddingBottom = "10px";
        section.appendChild(catHeader);

        const questionsList = document.createElement('div');
        questionsList.id = `list-${cat}`;
        section.appendChild(questionsList);

        const existingList = loadedQuestions[cat] || [];
        
        if (existingList.length === 0) {
            addQuestionForm(cat, questionsList); 
        } else {
            existingList.forEach(qData => {
                addQuestionForm(cat, questionsList, qData);
            });
        }

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-add';
        addBtn.innerHTML = "➕ Add Another Question";
        addBtn.onclick = () => addQuestionForm(cat, questionsList);
        section.appendChild(addBtn);

        container.appendChild(section);
    });

    function addQuestionForm(category, parentContainer, data = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'question-group';
        wrapper.setAttribute('data-category', category);

        wrapper.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>Question Item</h3>
                <button class="btn-delete">🗑️ Remove</button>
            </div>
            
            <label>Question Text:</label>
            <textarea class="q-text" placeholder="Enter the question here...">${data.question || ''}</textarea>
            
            <label>Correct Answer(s) (separate multiple with comma):</label>
            <input type="text" class="q-answer" placeholder="e.g. A, a, Apple" value="${data.answer ? (Array.isArray(data.answer) ? data.answer.join(',') : data.answer) : ''}">
            
            <label>Explanation:</label>
            <textarea class="q-explanation" placeholder="Explain why...">${data.explanation || ''}</textarea>
            
           
        `;

        wrapper.querySelector('.btn-delete').addEventListener('click', () => {
            if(confirm('Remove this question?')) {
                wrapper.remove();
            }
        });

        parentContainer.appendChild(wrapper);
    }

    saveBtn.addEventListener('click', () => {
        const newPool = {
            "C1_Question": [], "C2_Question": [], "C3_Question": [], "C4_Question": []
        };

        const groups = document.querySelectorAll('.question-group');
        let hasData = false;

        groups.forEach(group => {
            const cat = group.getAttribute('data-category');
            const qText = group.querySelector('.q-text').value.trim();
            const qAnsStr = group.querySelector('.q-answer').value.trim();
            const qExp = group.querySelector('.q-explanation').value.trim();
            const qImg = group.querySelector('.q-image').value.trim();

            if (qText && qAnsStr) {
                hasData = true;
                const ansArray = qAnsStr.split(',').map(s => s.trim()).filter(s => s !== "");
                
                const newQuestionObj = {
                    level: `${cat.split('_')[0]}: Custom`,
                    question: qText,
                    answer: ansArray,
                    explanation: qExp
                };

                if (qImg) newQuestionObj.image = qImg;
                
                newPool[cat].push(newQuestionObj);
            }
        });

        if (hasData) {
            localStorage.setItem('customQuestions', JSON.stringify(newPool));
            statusMsg.textContent = "✅ Saved! " + groups.length + " slots checked.";
            statusMsg.style.color = "green";
        } else {
            statusMsg.textContent = "⚠️ Please fill in at least one question.";
            statusMsg.style.color = "orange";
        }
    });

    clearBtn.addEventListener('click', () => {
        if(confirm("Delete all custom questions?")) {
            localStorage.removeItem('customQuestions');
            location.reload();
        }
    });
});