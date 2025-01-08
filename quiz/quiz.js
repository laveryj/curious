let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Fetch questions from JSON file
async function loadQuestions() {
  const response = await fetch('/quiz/questions.json');
  questions = await response.json();
}

// Start the quiz
document.getElementById('start-button').addEventListener('click', () => {
  document.getElementById('start-button').style.display = 'none';
  document.getElementById('quiz-container').style.display = 'block';
  currentQuestionIndex = 0;
  score = 0;
  showQuestion();
});

// Show a question
function showQuestion() {
  if (currentQuestionIndex >= questions.length || currentQuestionIndex >= 5) {
    showResults();
    return;
  }

  const question = questions[currentQuestionIndex];
  document.getElementById('question').innerText = question.question;
  
  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  question.options.forEach((option) => {
    const button = document.createElement('button');
    button.innerText = option;
    button.addEventListener('click', () => checkAnswer(option));
    optionsContainer.appendChild(button);
  });
}

// Check the answer
function checkAnswer(selectedOption) {
  const question = questions[currentQuestionIndex];

  if (selectedOption === question.correct) {
    score++;
    triggerConfetti();
  }

  currentQuestionIndex++;
  showQuestion();
}

// Show results
function showResults() {
  document.getElementById('quiz-container').innerHTML = `
    <h2>Quiz Completed!</h2>
    <p>Your Score: ${score}/${Math.min(5, questions.length)}</p>
  `;
}

// Confetti animation
function triggerConfetti() {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';

  let particles = [];
  const particleCount = 100;
  const gravity = 0.5;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 7 + 2,
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.speedY += gravity;

      if (p.y > canvas.height) {
        p.y = 0;
        p.speedY = Math.random() * 4 + 2;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();

  setTimeout(() => {
    canvas.style.display = 'none';
    particles = [];
  }, 2000);
}

// Load questions and initialize the quiz
loadQuestions();