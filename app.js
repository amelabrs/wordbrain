let words = [];
let currentIndex = 0;
let score = 0;
let results = [];
let moreHintsRevealed = false;
let recognition = null;

// DOM elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-btn');
const shuffleToggle = document.getElementById('shuffle-toggle');
const meaningText = document.getElementById('meaning-text');
const sentenceText = document.getElementById('sentence-text');
const memoryText = document.getElementById('memory-text');
const originText = document.getElementById('origin-text');
const hintMemory = document.getElementById('hint-memory');
const hintOrigin = document.getElementById('hint-origin');

const answerInput = document.getElementById('answer-input');
const micBtn = document.getElementById('mic-btn');
const submitBtn = document.getElementById('submit-btn');
const feedback = document.getElementById('feedback');
const feedbackText = document.getElementById('feedback-text');
const nextBtn = document.getElementById('next-btn');
const progressFill = document.getElementById('progress-fill');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const resultsBreakdown = document.getElementById('results-breakdown');
const restartBtn = document.getElementById('restart-btn');

// Load words
async function loadWords() {
    const response = await fetch('gormenghast_quiz_words.json');
    words = await response.json();
    // Filter to only words that have at least a sentence or meaning
    words = words.filter(w => w.meaning || w.sentence_with_blank);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showScreen(screen) {
    [startScreen, quizScreen, resultsScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function startQuiz() {
    if (shuffleToggle.checked) {
        shuffle(words);
    }
    currentIndex = 0;
    score = 0;
    results = [];
    updateProgress();
    showScreen(quizScreen);
    showWord();
}

function showWord() {
    const word = words[currentIndex];
    moreHintsRevealed = false;

    // Show meaning
    if (word.meaning) {
        meaningText.textContent = word.meaning;
        document.getElementById('hint-meaning').classList.remove('hidden');
    } else {
        document.getElementById('hint-meaning').classList.add('hidden');
    }

    // Show sentence
    if (word.sentence_with_blank) {
        sentenceText.textContent = word.sentence_with_blank;
        document.getElementById('hint-sentence').classList.remove('hidden');
    } else {
        document.getElementById('hint-sentence').classList.add('hidden');
    }

    // Show memory hint
    if (word.memory_hint) {
        memoryText.textContent = word.memory_hint;
        hintMemory.classList.remove('hidden');
    } else {
        hintMemory.classList.add('hidden');
    }

    // Show origin
    if (word.origin) {
        originText.textContent = word.origin;
        hintOrigin.classList.remove('hidden');
    } else {
        hintOrigin.classList.add('hidden');
    }

    // Reset answer area
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    feedback.classList.add('hidden');
    feedback.classList.remove('correct', 'incorrect');
    answerInput.focus();
}



function normalizeAnswer(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');
}

function checkAnswer() {
    const word = words[currentIndex];
    const userAnswer = normalizeAnswer(answerInput.value);
    const correctAnswer = normalizeAnswer(word.word);

    if (!userAnswer) return;

    const isCorrect = userAnswer === correctAnswer ||
        userAnswer.includes(correctAnswer) ||
        correctAnswer.includes(userAnswer);

    answerInput.disabled = true;
    submitBtn.disabled = true;
    feedback.classList.remove('hidden');

    if (isCorrect) {
        score++;
        feedback.classList.add('correct');
        feedbackText.textContent = `✓ Correct! The word is "${word.word}"`;
    } else {
        feedback.classList.add('incorrect');
        feedbackText.textContent = `✗ The answer was "${word.word}"`;
    }

    results.push({ word: word.word, correct: isCorrect });
    updateProgress();
}

function nextWord() {
    currentIndex++;
    if (currentIndex >= words.length) {
        showResults();
    } else {
        showWord();
    }
}

function updateProgress() {
    const total = words.length;
    const answered = results.length;
    progressFill.style.width = `${(answered / total) * 100}%`;
    scoreDisplay.textContent = `${score} / ${answered}`;
}

function showResults() {
    showScreen(resultsScreen);
    const pct = Math.round((score / words.length) * 100);
    finalScore.textContent = `You got ${score} out of ${words.length} (${pct}%)`;

    resultsBreakdown.innerHTML = results.map(r => `
        <div class="result-item ${r.correct ? 'correct' : 'incorrect'}">
            <span class="result-icon">${r.correct ? '✓' : '✗'}</span>
            <span class="result-word">${r.word}</span>
        </div>
    `).join('');
}

// Speech Recognition
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.classList.add('hidden');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        answerInput.value = transcript;
        micBtn.classList.remove('listening');
    };

    recognition.onerror = () => {
        micBtn.classList.remove('listening');
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
    };
}

function toggleMic() {
    if (!recognition) return;

    if (micBtn.classList.contains('listening')) {
        recognition.stop();
        micBtn.classList.remove('listening');
    } else {
        recognition.start();
        micBtn.classList.add('listening');
    }
}

// Event listeners
startBtn.addEventListener('click', startQuiz);
submitBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', nextWord);

micBtn.addEventListener('click', toggleMic);
restartBtn.addEventListener('click', () => {
    showScreen(startScreen);
});

answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !answerInput.disabled) {
        checkAnswer();
    }
});

// Init
loadWords().then(() => {
    setupSpeechRecognition();
});
