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

// Function to pause timer for a tab
function pauseTabTimer(tabId) {
  const tabInfo = tabTimers.get(tabId);
  if (tabInfo && tabInfo.timer) {
    clearTimeout(tabInfo.timer);
    tabInfo.timer = null;
    
    // Calculate accumulated time when pausing
    if (tabInfo.lastInactiveTime) {
      tabInfo.accumulatedTime += Date.now() - tabInfo.lastInactiveTime;
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
  browser.storage.local.get(['timeout', 'timeUnit']).then((result) => {
    if (!result.timeout) return; // Don't start timer if no timeout is set

    const timeoutMs = getTimeInMs(result.timeout, result.timeUnit);
    
    // Initialize or get tab info
    let tabInfo = tabTimers.get(tabId);
    if (!tabInfo || isNewTab) {
      tabInfo = {
        accumulatedTime: 0,
        lastInactiveTime: null,
        timer: null
      };
      tabTimers.set(tabId, tabInfo);
    }

    // Only start timer if tab is not active
    if (tabId !== activeTabId) {
      tabInfo.lastInactiveTime = Date.now();
      
      // Calculate remaining time
      const remainingTime = timeoutMs - tabInfo.accumulatedTime;
      
      if (remainingTime <= 0) {
        // Check if tab is pinned before closing
        isTabPinned(tabId).then(isPinned => {
          if (!isPinned) {
            browser.tabs.remove(tabId).catch((error) => {
              console.error(`Error closing tab ${tabId}:`, error);
            });
            tabTimers.delete(tabId);
          }
        });
      } else {
        // Set timer for remaining time
        tabInfo.timer = setTimeout(async () => {
          // Check if tab is pinned before closing
          const isPinned = await isTabPinned(tabId);
          if (!isPinned) {
            browser.tabs.remove(tabId).catch((error) => {
              console.error(`Error closing tab ${tabId}:`, error);
            });
            tabTimers.delete(tabId);
          }
        }, remainingTime);
      }
    }
  });
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
