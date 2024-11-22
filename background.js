let activeTabId = null;
const tabTimers = new Map();

// Format remaining time in a human-readable way
function formatTimeRemaining(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Convert time to milliseconds based on unit
function getTimeInMs(time, unit) {
  switch (unit) {
    case 'minutes':
      return time * 60 * 1000;
    case 'hours':
      return time * 60 * 60 * 1000;
    default:
      return time * 60 * 1000; // Default to minutes
  }
}

// Initialize context menu
function initializeContextMenu() {
  browser.menus.create({
    id: "tab-time-remaining",
    title: "Time remaining",
    contexts: ["tab"]
  });
}

// Update context menu title for a specific tab
async function updateContextMenuTitle(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab) {
      console.log(`Tab ${tabId} not found`);
      return;
    }

    const settings = await browser.storage.local.get(['timeout', 'timeUnit']);
    if (!settings.timeout) {
      console.log('No timeout settings found');
      return;
    }

    const tabInfo = tabTimers.get(tabId);
    if (!tabInfo) {
      console.log(`No timer info for tab ${tabId}`);
      return;
    }

    const timeoutMs = getTimeInMs(settings.timeout, settings.timeUnit);
    const now = Date.now();
    const totalInactiveTime = tabInfo.accumulatedTime + 
      (tabInfo.lastInactiveTime ? (now - tabInfo.lastInactiveTime) : 0);
    
    const remainingTime = timeoutMs - totalInactiveTime;
    const menuTitle = tab.pinned ? 'Pinned tab - will not auto-close' : 
                     (tabId === activeTabId ? 'Active tab' : 
                     `Will close in ${formatTimeRemaining(remainingTime)}`);

    await browser.menus.update("tab-time-remaining", {
      title: menuTitle
    });
    
    // Refresh the menu to show the updated title
    await browser.menus.refresh();

  } catch (error) {
    console.error(`Error updating context menu for tab ${tabId}:`, error);
  }
}

// Initialize context menu when extension loads
initializeContextMenu();

// Update the context menu when it's shown
browser.menus.onShown.addListener(async (info, tab) => {
  if (info.contexts.includes("tab")) {
    await updateContextMenuTitle(tab.id);
  }
});

// Start timer for a tab
function startTabTimer(tabId, isNewTab = false) {
  // Don't start timer for active tab
  if (tabId === activeTabId) return;

  const existingTimer = tabTimers.get(tabId);
  if (existingTimer) {
    // If tab was inactive, update last inactive time
    if (!existingTimer.lastInactiveTime) {
      existingTimer.lastInactiveTime = Date.now();
    }
  } else {
    // Create new timer for tab
    tabTimers.set(tabId, {
      accumulatedTime: 0,
      lastInactiveTime: isNewTab ? Date.now() : null
    });
  }
}

// Stop timer for a tab
function stopTabTimer(tabId) {
  const timer = tabTimers.get(tabId);
  if (timer && timer.lastInactiveTime) {
    // Calculate and store accumulated inactive time
    timer.accumulatedTime += Date.now() - timer.lastInactiveTime;
    timer.lastInactiveTime = null;
  }
}

// Check if a tab should be closed
async function checkTabForClose(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab || tab.pinned) return;

    const settings = await browser.storage.local.get(['timeout', 'timeUnit']);
    if (!settings.timeout) return;

    const timer = tabTimers.get(tabId);
    if (!timer) return;

    const timeoutMs = getTimeInMs(settings.timeout, settings.timeUnit);
    const totalInactiveTime = timer.accumulatedTime + 
      (timer.lastInactiveTime ? (Date.now() - timer.lastInactiveTime) : 0);

    if (totalInactiveTime >= timeoutMs) {
      await browser.tabs.remove(tabId);
      tabTimers.delete(tabId);
    }
  } catch (error) {
    console.error(`Error checking tab ${tabId} for close:`, error);
  }
}

// Listen for tab activation changes
browser.tabs.onActivated.addListener(({ tabId, previousTabId }) => {
  activeTabId = tabId;
  
  // Stop timer for newly active tab
  stopTabTimer(tabId);
  
  // Start timer for previously active tab
  if (previousTabId) {
    startTabTimer(previousTabId);
  }
});

// Listen for new tabs
browser.tabs.onCreated.addListener((tab) => {
  startTabTimer(tab.id, true);
});

// Listen for tab removal
browser.tabs.onRemoved.addListener((tabId) => {
  tabTimers.delete(tabId);
});

// Listen for window focus changes
browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    // Window lost focus, start timer for active tab
    if (activeTabId) {
      startTabTimer(activeTabId);
    }
  } else {
    // Window gained focus, stop timer for active tab
    if (activeTabId) {
      stopTabTimer(activeTabId);
    }
  }
});

// Periodically check tabs for closing
setInterval(() => {
  tabTimers.forEach((_, tabId) => {
    checkTabForClose(tabId);
  });
}, 1000); // Check every second
