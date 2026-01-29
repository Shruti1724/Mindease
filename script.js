// Menu Toggle
document.getElementById('menuToggle').addEventListener('click', function() {
  document.getElementById('menu').classList.toggle('active');
});

// Breathing Bubble Animation Control
function startBreathingExercise() {
  const bubble = document.getElementById('breathingBubble');
  bubble.style.animation = 'none';
  setTimeout(() => {
    bubble.style.animation = 'bubble-rise 8s infinite ease-in-out';
  }, 10);
}

// Journal Functions
function insertPrompt(prompt) {
  const textarea = document.getElementById('journalText');
  textarea.value += prompt + '\n\n';
}

function saveJournal() {
  const date = document.getElementById('journalDate').value;
  const text = document.getElementById('journalText').value;
  
  if (!date || !text) {
    alert('Please select a date and write something in your journal.');
    return;
  }
  
  // Here you would typically save to a database
  // For now, we'll just show a success message
  alert('Journal entry saved successfully!');
  clearJournal();
}

function clearJournal() {
  document.getElementById('journalText').value = '';
}

function selectMood(mood) {
  // Remove active class from all mood options
  document.querySelectorAll('.mood-option').forEach(option => {
    option.classList.remove('active');
  });
  
  // Add active class to selected mood
  const selectedMood = document.querySelector(`.mood-option[onclick="selectMood('${mood}')"]`);
  if (selectedMood) {
    selectedMood.classList.add('active');
  }
}

// Calendar Functions
function generateCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return;
  
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  // Clear existing calendar
  calendarGrid.innerHTML = '';
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    // Add special classes
    if (day === date.getDate()) {
      dayElement.classList.add('today');
    }
    
    // Randomly add has-entry class for demo purposes
    if (Math.random() > 0.7) {
      dayElement.classList.add('has-entry');
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

// Initialize calendar when the page loads
document.addEventListener('DOMContentLoaded', function() {
  generateCalendar();
});

// Daily Challenges functionality
function completeChallenge(challengeId) {
  const button = document.querySelector(`[data-challenge="${challengeId}"]`);
  if (button && !button.classList.contains('completed')) {
    button.textContent = 'Completed!';
    button.classList.add('completed');
    
    // Store completion in localStorage
    const today = new Date().toISOString().split('T')[0];
    const completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '{}');
    if (!completedChallenges[today]) {
      completedChallenges[today] = [];
    }
    completedChallenges[today].push(challengeId);
    localStorage.setItem('completedChallenges', JSON.stringify(completedChallenges));
    
    // Show success message
    showNotification('Challenge completed! Keep up the great work!', 'success');
  }
}

// Check and reset daily challenges
function checkDailyChallenges() {
  const today = new Date().toISOString().split('T')[0];
  const completedChallenges = JSON.parse(localStorage.getItem('completedChallenges') || '{}');
  
  // Reset challenges if it's a new day
  if (!completedChallenges[today]) {
    const buttons = document.querySelectorAll('.challenge-btn');
    buttons.forEach(button => {
      button.textContent = 'Complete Challenge';
      button.classList.remove('completed');
    });
  } else {
    // Mark completed challenges
    completedChallenges[today].forEach(challengeId => {
      const button = document.querySelector(`[data-challenge="${challengeId}"]`);
      if (button) {
        button.textContent = 'Completed!';
        button.classList.add('completed');
      }
    });
  }
}

// Initialize challenges when page loads
document.addEventListener('DOMContentLoaded', () => {
  checkDailyChallenges();
}); 