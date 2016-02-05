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

class Activity {

  /**
   * @param {!Window} win
   */
  constructor(win) {
    /** @const */
    this.win = win;
  }

  /**
   * Returns the total engaged time of the page session.
   * @return {number}
   */
  getTotalEngagedTime() {
    return 42;
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
