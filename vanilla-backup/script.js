const topics = [
    "Anatomy & Physiology",
    "Pharmacology",
    "Pathophysiology",
    "Microbiology",
    "Biochemistry",
    "Immunology",
    "Cardiology",
    "Neurology",
    "Endocrinology",
    "Gastroenterology",
    "Pulmonology",
    "Nephrology",
    "Hematology",
    "Psychiatry",
    "Pediatrics",
    "Surgery Principles",
    "Medical Genetics",
    "Infectious Diseases",
    "Oncology",
    "Rheumatology",
    "Dermatology",
    "Obstetrics & Gynecology"
];

// Elements
const stageTopic = document.getElementById('stage-topic');
const stageTime = document.getElementById('stage-time');
const stageTimer = document.getElementById('stage-timer');

const btnSpin = document.getElementById('btn-spin');
const slotReel = document.getElementById('slot-reel');
const selectedTopicEl = document.getElementById('selected-topic');
const activeTopicEl = document.getElementById('active-topic');

const presetBtns = document.querySelectorAll('.preset-btn');
const btnBackTopic = document.getElementById('btn-back-topic');
const btnPause = document.getElementById('btn-pause');
const btnCancel = document.getElementById('btn-cancel');

// Timer Displays
const mainTimerDisplay = document.getElementById('main-timer-display');
const mainProgress = document.getElementById('main-progress');
const descTimerDisplay = document.getElementById('desc-timer-display');
const descProgress = document.getElementById('desc-progress');
const descTimerContainer = document.getElementById('desc-timer-container');

// State
let selectedTopic = "";
let timerInterval = null;
let mainTimeRemaining = 0;
let mainTimeTotal = 0;
let descTimeRemaining = 0;
let descTimeTotal = 120; // 2 minutes setup
let isPaused = false;

// Initialization
function initSlotReel() {
    slotReel.innerHTML = '';
    // Duplicate for infinite scrolling effect before landing
    const displayTopics = [...topics, ...topics, ...topics].sort(() => 0.5 - Math.random());
    
    displayTopics.forEach(t => {
        const li = document.createElement('li');
        li.className = 'slot-item';
        li.textContent = t;
        slotReel.appendChild(li);
    });
}

initSlotReel();

// 1. Topic Selection Logic
btnSpin.addEventListener('click', () => {
    btnSpin.disabled = true;
    btnSpin.textContent = "Rolling...";
    
    // Calculate winning index (somewhere in the middle of our large list)
    const items = slotReel.children;
    const itemHeight = 40;
    const paddingOffset = 40; // centers it in the 120px window (120/2 - 40/2)
    
    // Target index randomly between 30 and 50 (to ensure enough spin)
    const targetIdx = Math.floor(Math.random() * 20) + 30;
    const targetTopic = items[targetIdx].textContent;
    selectedTopic = targetTopic;
    
    // Calculate translateY distance
    const distance = -(targetIdx * itemHeight) + paddingOffset;
    
    // Reset reel position
    slotReel.style.transition = 'none';
    slotReel.style.transform = 'translateY(0)';
    
    // Trigger reflow
    void slotReel.offsetWidth;
    
    // Spin!
    slotReel.style.transition = 'transform 3s cubic-bezier(0.15, 0.85, 0.25, 1)';
    slotReel.style.transform = `translateY(${distance}px)`;
    
    // On finish spinning
    setTimeout(() => {
        // Highlight active
        for(let i=0; i<items.length; i++) {
            items[i].classList.remove('active-item');
        }
        items[targetIdx].classList.add('active-item');
        
        setTimeout(() => {
            // Transition to Next Stage
            selectedTopicEl.textContent = selectedTopic;
            activeTopicEl.textContent = selectedTopic;
            
            stageTopic.classList.add('hidden');
            stageTopic.classList.remove('active');
            stageTime.classList.remove('hidden');
            stageTime.classList.add('active');
            
            // Reset for next time
            btnSpin.disabled = false;
            btnSpin.textContent = "Spin to Decide";
            initSlotReel();
            slotReel.style.transition = 'none';
            slotReel.style.transform = 'translateY(0)';
        }, 1500);
    }, 3000);
});

btnBackTopic.addEventListener('click', () => {
    stageTime.classList.add('hidden');
    stageTime.classList.remove('active');
    stageTopic.classList.remove('hidden');
    stageTopic.classList.add('active');
});

// 2. Time Selection Logic
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const minutes = parseInt(btn.getAttribute('data-time'));
        startSession(minutes);
    });
});

// 3. Timer Logic
function startSession(minutes) {
    mainTimeTotal = minutes * 60;
    mainTimeRemaining = mainTimeTotal;
    
    // Max 2 min desc timer, or if main timer is somehow shorter (e.g. 1 min test)
    descTimeTotal = Math.min(120, mainTimeTotal); 
    descTimeRemaining = descTimeTotal;
    
    isPaused = false;
    btnPause.textContent = "Pause";
    
    descTimerContainer.style.display = 'flex';
    
    updateTimerDisplays();
    updateProgressBars();
    
    // Switch stages
    stageTime.classList.add('hidden');
    stageTime.classList.remove('active');
    stageTimer.classList.remove('hidden');
    stageTimer.classList.add('active');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(timerTick, 1000);
}

function timerTick() {
    if (isPaused) return;
    
    if (mainTimeRemaining > 0) {
        mainTimeRemaining--;
    }
    
    if (descTimeRemaining > 0) {
        descTimeRemaining--;
    } else {
        if (descTimerContainer.style.display !== 'none') {
            descTimerContainer.style.opacity = '0';
            setTimeout(() => {
                descTimerContainer.style.display = 'none';
                descTimerContainer.style.opacity = '1';
            }, 500);
        }
    }
    
    if (mainTimeRemaining === 0) {
        clearInterval(timerInterval);
        alert("Study Session Complete! Excellent Work.");
        resetApp();
        return;
    }
    
    updateTimerDisplays();
    updateProgressBars();
}

function updateTimerDisplays() {
    mainTimerDisplay.textContent = formatTime(mainTimeRemaining);
    descTimerDisplay.textContent = formatTime(descTimeRemaining);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateProgressBars() {
    // Circle progress (565.48 is max dashoffset)
    const mainPercentDone = 1 - (mainTimeRemaining / mainTimeTotal);
    const mainOffset = 565.48 - (565.48 * mainPercentDone);
    mainProgress.style.strokeDashoffset = mainOffset;
    
    // Horizontal progress
    if (descTimeRemaining > 0) {
        const descPercent = (descTimeRemaining / descTimeTotal) * 100;
        descProgress.style.width = `${descPercent}%`;
    }
}

// Controls
btnPause.addEventListener('click', () => {
    isPaused = !isPaused;
    btnPause.textContent = isPaused ? "Resume" : "Pause";
});

btnCancel.addEventListener('click', () => {
    const confirm = window.confirm("Are you sure you want to end your study session early?");
    if (confirm) {
        clearInterval(timerInterval);
        resetApp();
    }
});

function resetApp() {
    stageTimer.classList.add('hidden');
    stageTimer.classList.remove('active');
    stageTopic.classList.remove('hidden');
    stageTopic.classList.add('active');
    
    // Reset SVG offset
    mainProgress.style.strokeDashoffset = 0;
}
