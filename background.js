// Store tab timers and their accumulated inactive time
let tabTimers = new Map();
let activeTabId = null;

// Convert time to milliseconds
function getTimeInMs(timeout, timeUnit) {
  return timeout * (timeUnit === 'hours' ? 3600000 : 60000);
}

// Function to check if a tab is pinned
async function isTabPinned(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    return tab.pinned;
  } catch (error) {
    console.error(`Error checking if tab ${tabId} is pinned:`, error);
    return false;
  }
}

// Function to check and close expired tabs
async function checkExpiredTabs() {
  const now = Date.now();
  const settings = await browser.storage.local.get(['timeout', 'timeUnit']);
  if (!settings.timeout) return;

  const timeoutMs = getTimeInMs(settings.timeout, settings.timeUnit);

  for (const [tabId, tabInfo] of tabTimers.entries()) {
    if (tabId === activeTabId) continue;
    
    const isPinned = await isTabPinned(tabId);
    if (isPinned) {
      tabTimers.delete(tabId);
      continue;
    }

    const totalInactiveTime = tabInfo.accumulatedTime + 
      (tabInfo.lastInactiveTime ? (now - tabInfo.lastInactiveTime) : 0);

    if (totalInactiveTime >= timeoutMs) {
      try {
        await browser.tabs.remove(tabId);
        tabTimers.delete(tabId);
      } catch (error) {
        console.error(`Error closing tab ${tabId}:`, error);
      }
    }
  }
}

// Function to pause timer for a tab
function pauseTabTimer(tabId) {
  const tabInfo = tabTimers.get(tabId);
  if (tabInfo) {
    if (tabInfo.lastInactiveTime) {
      tabInfo.accumulatedTime += Date.now() - tabInfo.lastInactiveTime;
      tabInfo.lastInactiveTime = null;
    }
    if (tabInfo.checkInterval) {
      clearInterval(tabInfo.checkInterval);
      tabInfo.checkInterval = null;
    }
  }
}

// Function to start or resume timer for a tab
async function startTabTimer(tabId, isNewTab = false) {
  // Don't start timer if tab is pinned
  if (await isTabPinned(tabId)) {
    return;
  }

  // Get current settings
  const settings = await browser.storage.local.get(['timeout', 'timeUnit']);
  if (!settings.timeout) return; // Don't start timer if no timeout is set

  // Initialize or get tab info
  let tabInfo = tabTimers.get(tabId);
  if (!tabInfo || isNewTab) {
    tabInfo = {
      accumulatedTime: 0,
      lastInactiveTime: null,
      checkInterval: null
    };
    tabTimers.set(tabId, tabInfo);
  }

  // Only start timer if tab is not active
  if (tabId !== activeTabId) {
    tabInfo.lastInactiveTime = Date.now();
    
    // Set up periodic check
    if (!tabInfo.checkInterval) {
      tabInfo.checkInterval = setInterval(() => checkExpiredTabs(), 5000); // Check every 5 seconds
    }
  }
}

// Listen for new tabs
browser.tabs.onCreated.addListener((tab) => {
  startTabTimer(tab.id, true);
});

// Listen for tab activation
browser.tabs.onActivated.addListener((activeInfo) => {
  // Pause timer for newly activated tab
  if (tabTimers.has(activeInfo.tabId)) {
    pauseTabTimer(activeInfo.tabId);
  }
  
  // Resume timer for previously active tab
  if (activeTabId && activeTabId !== activeInfo.tabId) {
    startTabTimer(activeTabId);
  }
  
  activeTabId = activeInfo.tabId;
});

// Listen for settings updates from popup
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateSettings') {
    // Restart timers for all tabs with new settings
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach((tab) => {
        if (tab.id !== activeTabId) {
          startTabTimer(tab.id);
        }
      });
    });
  }
});

// Clean up when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  if (tabTimers.has(tabId)) {
    pauseTabTimer(tabId);
    tabTimers.delete(tabId);
  }
});

// Listen for tab pinned/unpinned events
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if ('pinned' in changeInfo) {
    if (changeInfo.pinned) {
      // If tab becomes pinned, remove its timer
      if (tabTimers.has(tabId)) {
        pauseTabTimer(tabId);
        tabTimers.delete(tabId);
      }
    } else {
      // If tab becomes unpinned, start timer if it's not active
      if (tabId !== activeTabId) {
        startTabTimer(tabId, true);
      }
    }
  }
});

// Initialize active tab on extension startup
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  if (tabs[0]) {
    activeTabId = tabs[0].id;
  }
});

// Set up periodic check for all tabs
setInterval(checkExpiredTabs, 5000); // Check every 5 seconds

// Listen for visibility changes (when browser window becomes visible again)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkExpiredTabs();
  }
});
