/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Provides an ability to collect data about activities the user
 * has performed on the page.
 */

import {getService} from '../service';
import {listen} from '../event-helper';


/** @private @const */
const MAX_INACTIVE_SEC_ = 5;

class ActivityHistory {

  /**
   * @param {number} startTime
   */
  constructor(startTime) {
    /** @private {number} */
    this.earliest_ = startTime;

    /** @private {number} */
    this.latest_ = startTime;

    /** @private {!Object<number,boolean>} */
    this.store_ = {};

    /** @private {number} */
    this.numStored_ = 0;

    /** @private {number} */
    this.prevTotalEngagedTime_ = 0;

    /** @private {boolean} */
    this.prevTotalEngagedTimeValid_ = true;
  }


  /**
   * Add a time bucket to mark as having had an activity take place.
   * @param {number}
   */
  add(time) {
    if (time > this.latest_) {
      this.latest_ = time;
    }

    if (time < this.earliest_) {
      this.earliest_ = time;
    }

    if (!this.store_[time]) {
      this.store_[time] = true;
      this.numStored_ += 1;
      this.prevTotalEngagedTimeValid_ = false;
    }
  }

  /**
   * Get the total engaged time recorded in ActivityHistory.
   * @return {number}
   */
  getTotalEngagedTime() {
    if (this.prevTotalEngagedTimeValid_) {
      return this.prevTotalEngagedTime_;
    }

    let totalEngagedTime = 0;
    let lastActivityDelta = MAX_INACTIVE_SEC_;

    for (let i = this.earliest_; i < this.latest_; i++) {
      // keep track of the distance between the current bucket and the last
      // bucket with a recorded activity
      if (this.store_[i]) {
        lastActivityDelta = 0;
      } else {
        lastActivityDelta += 1;
      }

      // if there was activity within the last MAX_INACTIVE_SEC_, increment
      // total engaged time.
      if (lastActivityDelta < MAX_INACTIVE_SEC_) {
        totalEngagedTime += 1;
      }
    }

    this.prevTotalEngagedTime_ = totalEngagedTime;
    this.prevTotalEngagedTimeValid_ = true;
    return totalEngagedTime;
  }
}

export class Activity {

  /**
   * @param {!Window} win
   */
  constructor(win) {
    /** @const */
    this.win_ = win;

    /** @private {boolean} */
    this.boundStopIgnore_ = this.stopIgnore_.bind(this);

    /** @private {function} */
    this.boundHandleActivity_ = this.handleActivity_.bind(this);

    /** @private {Array<!UnlistenDef>} */
    this.unlistenFuncs_ = [];

    /** @private {boolean} */
    this.ignoreActivity_ = false;

    getService(this.win, 'viewer').whenFirstVisible().then(
        this.start_.bind(this));
  }

  start_() {
    const startTime = Math.floor((new Date()).getTime() / 1000);

    /** @const {!ActivityHistory} **/
    this.activityHistory_ = new ActivityHistory(startTime);

    this.setUpActivityListeners_();
  }

  stopIgnore_() {
    this.ignoreActivity_ = false;
  }

  setUpActivityListeners_() {
    this.unlistenFuncs_.push(listen(this.win.document.documentElement,
        'scroll', this.boundHandleActivity_));

    // other activities will be tracked here
  }

  handleActivity_() {
    if (this.ignoreActivity_) {
      return;
    }
    this.ignoreActivity_ = true;

    // use one second granularity for tracking activity
    const secondKey = Math.floor((new Date()).getTime() / 1000);

    // stop ignoring activity at the start of the next activity bucket
    setTimeout(this.boundStopIgnore_, secondKey * 1000 + 1000);

    this.activityHistory_.add(secondKey);
  }

  /**
   * Remove all listeners associated with this Activity instance.
   */
  unlisten_() {
    for (let i = 0; i < this.unlistenFuncs_.length; i++) {
      if (typeof this.unlistenFuncs_[i] === 'function') {
        this.unlistenFuncs_[i]();
      }
    }
    this.unlistenFuncs_ = [];
  }

  cleanup_() {
    this.unlisten_();
  }

  /**
   * Get total engaged time since the page became visible.
   * @return {number}
   */
  getTotalEngagedTime() {
    return this.activityHistory_.getTotalEngagedTime();
  }
};


/**
 * @param  {!Window} win
 * @return {!Activity}
 */
export function installActivityService(win) {
  return getService(win, 'activity', () => {
    return new Activity(win);
  });
};
