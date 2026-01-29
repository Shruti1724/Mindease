// Journal Functions
function insertPrompt(prompt) {
  const textarea = document.getElementById('journalText');
  textarea.value += prompt + '\n\n';
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

// Initialize calendar
function initializeCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarMonth = document.getElementById('calendarMonth');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  const prevYearBtn = document.getElementById('prevYear');
  const nextYearBtn = document.getElementById('nextYear');
  const eventModal = document.getElementById('eventModal');
  const closeModal = document.getElementById('closeModal');
  const saveEventBtn = document.getElementById('saveEvent');
  const eventForm = document.getElementById('eventForm');
  
  if (!calendarGrid) return;
  
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  // Update calendar month title
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  function updateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Update calendar month title
    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  // Clear existing calendar
  calendarGrid.innerHTML = '';
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay.getDay(); i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
      
      // Check if it's today
      if (day === currentDate.getDate() && 
          currentMonth === currentDate.getMonth() && 
          currentYear === currentDate.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    // Check if there's a journal entry for this day
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (journalEntries.some(entry => entry.entry_date === dateStr)) {
      dayElement.classList.add('has-entry');
    }
      
      // Add event indicator if there are events
      if (hasEvents(dateStr)) {
        dayElement.classList.add('has-event');
      }
    
    dayElement.textContent = day;
      
      // Add event management
      dayElement.addEventListener('click', () => {
        const eventDate = document.getElementById('eventDate');
        const eventTitle = document.getElementById('eventTitle');
        const eventDescription = document.getElementById('eventDescription');
        const eventsList = document.getElementById('eventsList');
        const modalDate = document.getElementById('modalDate');
        
        eventDate.value = dateStr;
        eventTitle.value = '';
        eventDescription.value = '';
        
        // Format date for display
        const displayDate = new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        modalDate.textContent = displayDate;
        
        // Load existing events
        const existingEvents = getEvents(dateStr);
        eventsList.innerHTML = '';
        
        if (existingEvents.length > 0) {
          existingEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = `
              <div class="event-content">
                <h4>${event.title}</h4>
                <p>${event.description || 'No description'}</p>
              </div>
              <button class="delete-event" data-id="${event.id}">×</button>
            `;
            eventsList.appendChild(eventItem);
          });
        } else {
          eventsList.innerHTML = '<p class="no-events">No events for this day</p>';
        }
        
        eventModal.style.display = 'block';
      });
      
    calendarGrid.appendChild(dayElement);
  }
}

  // Event management functions
  function hasEvents(date) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    return events[date] && events[date].length > 0;
  }
  
  function getEvents(date) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    return events[date] || [];
  }
  
  function saveEvent(date, title, description) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    if (!events[date]) {
      events[date] = [];
    }
    events[date].push({
      id: Date.now(), // Unique ID for each event
      title,
      description,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }
  
  function deleteEvent(date, eventId) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    if (events[date]) {
      events[date] = events[date].filter(event => event.id !== eventId);
      if (events[date].length === 0) {
        delete events[date];
      }
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
  }
  
  // Navigation buttons
  prevMonthBtn.addEventListener('click', () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    updateCalendar();
  });
  
  nextMonthBtn.addEventListener('click', () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    updateCalendar();
  });
  
  prevYearBtn.addEventListener('click', () => {
    currentYear--;
    updateCalendar();
  });
  
  nextYearBtn.addEventListener('click', () => {
    currentYear++;
    updateCalendar();
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === eventModal) {
      eventModal.style.display = 'none';
    }
  });
  
  // Close modal with X button
  closeModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
  });
  
  // Handle form submission
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('eventDate').value;
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    
    if (title) {
      saveEvent(date, title, description);
      eventModal.style.display = 'none';
      updateCalendar();
    }
  });
  
  // Handle event deletion
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-event')) {
      const eventId = parseInt(e.target.dataset.id);
      const date = document.getElementById('eventDate').value;
      deleteEvent(date, eventId);
      
      // Update the events list
      const eventsList = document.getElementById('eventsList');
      const existingEvents = getEvents(date);
      eventsList.innerHTML = '';
      
      if (existingEvents.length > 0) {
        existingEvents.forEach(event => {
          const eventItem = document.createElement('div');
          eventItem.className = 'event-item';
          eventItem.innerHTML = `
            <div class="event-content">
              <h4>${event.title}</h4>
              <p>${event.description || 'No description'}</p>
            </div>
            <button class="delete-event" data-id="${event.id}">×</button>
          `;
          eventsList.appendChild(eventItem);
        });
      } else {
        eventsList.innerHTML = '<p class="no-events">No events for this day</p>';
      }
    }
  });
  
  // Initialize calendar
  updateCalendar();
}

// Load entry for a specific date
function loadEntryForDate(dateStr) {
  const entry = journalEntries.find(entry => entry.entry_date === dateStr);
  if (entry) {
    loadEntry(entry);
  } else {
    // Clear the form and set the date
    clearJournal();
    document.getElementById('journalDate').value = dateStr;
  }
}

// Update journal history
function updateJournalHistory() {
  const historyContainer = document.querySelector('.journal-history');
  if (!historyContainer) return;

  // Sort entries by date in descending order
  const sortedEntries = [...journalEntries].sort((a, b) => 
    new Date(b.entry_date) - new Date(a.entry_date)
  );

  // Update total entries count
  document.getElementById('totalEntries').textContent = sortedEntries.length;

  // Update monthly entries count
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEntries = sortedEntries.filter(entry => {
    const entryDate = new Date(entry.entry_date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });
  document.getElementById('monthlyEntries').textContent = monthlyEntries.length;

  // Update most common mood
  const moodCounts = {};
  sortedEntries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('mostCommonMood').textContent = mostCommonMood ? mostCommonMood[0] : '-';

  // Update streak
  let streak = 0;
  if (sortedEntries.length > 0) {
    let currentStreak = 1;
    let lastDate = new Date(sortedEntries[0].entry_date);
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i].entry_date);
      const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
    
    streak = currentStreak;
  }
  document.getElementById('streak').textContent = streak;

  // Update history entries
  historyContainer.innerHTML = '<h3>Past Entries</h3>';
  
  if (sortedEntries.length === 0) {
    historyContainer.innerHTML += '<p class="no-entries">No past entries found.</p>';
    return;
  }
  
  sortedEntries.forEach(entry => {
    const entryElement = document.createElement('div');
    entryElement.className = 'journal-history-entry';
    
    const date = new Date(entry.entry_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const mood = entry.mood || 'Not specified';
    const preview = entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '');
    
    entryElement.innerHTML = `
      <div class="entry-header">
        <span class="entry-date">${date}</span>
        <span class="entry-mood">${mood}</span>
      </div>
      <div class="entry-preview">${preview}</div>
    `;
    
    entryElement.addEventListener('click', () => loadEntry(entry));
    historyContainer.appendChild(entryElement);
  });
}

// Load journal entries when the page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeCalendar();
  loadJournalEntries();
});

// Function to load journal entries from the server
async function loadJournalEntries() {
  try {
    const response = await fetch('http://localhost:3000/api/journal/entries', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load journal entries');
    }
    
    const data = await response.json();
    journalEntries = data.entries;
    updateJournalHistory();
  } catch (error) {
    console.error('Error loading journal entries:', error);
  }
}

function clearJournal() {
  document.getElementById('journalText').value = '';
  document.querySelectorAll('.mood-option').forEach(option => {
    option.classList.remove('active');
  });
  document.querySelectorAll('.journal-tag').forEach(tag => {
    if (!tag.classList.contains('tag-input')) {
      tag.remove();
    }
  });
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('journalDate').value = today;
}

// Function to load an entry into the form
function loadEntry(entry) {
  document.getElementById('journalDate').value = entry.entry_date;
  document.getElementById('journalText').value = entry.content;
  
  // Set mood if available
  if (entry.mood) {
    document.querySelectorAll('.mood-option').forEach(option => {
      if (option.querySelector('.mood-label').textContent === entry.mood) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  // Load tags if available
  const tagContainer = document.querySelector('.tag-container');
  tagContainer.querySelectorAll('.journal-tag:not(.tag-input)').forEach(tag => tag.remove());
  
  if (entry.tags) {
    const tags = JSON.parse(entry.tags);
    tags.forEach(tag => addTag(tag));
  }
}

// Function to add a tag
function addTag(tagText) {
  const tagContainer = document.querySelector('.tag-container');
  const tagInput = tagContainer.querySelector('.tag-input');
  
  const tag = document.createElement('div');
  tag.className = 'journal-tag';
  tag.innerHTML = `${tagText} <i class="fas fa-times"></i>`;
  
  tag.querySelector('i').addEventListener('click', () => tag.remove());
  tagContainer.insertBefore(tag, tagInput);
}

// Function to get selected tags
function getSelectedTags() {
  const tags = [];
  document.querySelectorAll('.journal-tag:not(.tag-input)').forEach(tag => {
    tags.push(tag.textContent.trim());
  });
  return tags;
} 