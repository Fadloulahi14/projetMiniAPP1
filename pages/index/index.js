// ============================================================================
// HOME PAGE
// Demonstrates: initPromise pattern, EventBus, component usage, navigation
// ============================================================================

const app = getApp();
const { STATE_KEYS, EVENTS } = app.globalData;

Page({
  data: {
    isLoading: true,
    userName: '',
    showModal: false,
  },

  /**
   * Page initialization
   * Awaits app initialization before accessing shared state
   */
  async onLoad() {
    // Wait for app initialization to complete (non-blocking pattern)
    await app.globalData.initPromise;

    // Read initial data from EventBus
    const userData = app.globalData.eventBus.getState(STATE_KEYS.USER_DATA);

    this.setData({
      isLoading: false,
      userName: userData?.fullName || 'Guest',
    });

    // Subscribe to user data changes
    this._unsubUser = app.globalData.eventBus.onState(STATE_KEYS.USER_DATA, (data) => {
      this.setData({ userName: data?.fullName || 'Guest' });
    });
  },

  /**
   * Cleanup subscriptions on page unload
   */
  onUnload() {
    if (typeof this._unsubUser === 'function') {
      this._unsubUser();
    }
  },

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Navigate to demo page
   */
  handleNavigateDemo() {
    wx.navigateTo({ url: '/pages/demo/index' });
  },

  /**
   * Toggle modal visibility
   */
  handleToggleModal() {
    this.setData({ showModal: !this.data.showModal });
  },

  /**
   * Close modal
   */
  handleCloseModal() {
    this.setData({ showModal: false });
  },
});
