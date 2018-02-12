/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let adsManager;
let adsLoader;
let adDisplayContainer;
let playButton;
let videoContent;

function init() {
  videoContent = document.getElementById('contentElement');
  playButton = document.getElementById('playButton');
  playButton.addEventListener('click', playAds);
  setUpIMA();
}

function setUpIMA() {
  // Create the ad display container.
  adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById('adContainer'), videoContent);
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false);
  adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false);

  // An event listener to tell the SDK that our content video
  // is completed so the SDK can play any post-roll ads.
  const contentEndedListener = () => {adsLoader.contentComplete();};
  videoContent.onended = contentEndedListener;

  // Request video ads.
  const adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
      'sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&' +
      'impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&' +
      'cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = 640;
  adsRequest.linearAdSlotHeight = 400;

  adsRequest.nonLinearAdSlotWidth = 640;
  adsRequest.nonLinearAdSlotHeight = 150;

  adsLoader.requestAds(adsRequest);
}

function playAds() {
  // Initialize the container. Must be done via a user action on mobile devices.
  videoContent.load();
  adDisplayContainer.initialize();

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    videoContent.play();
  }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  const adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  // videoContent should be set to the content video element.
  adsManager = adsManagerLoadedEvent.getAdsManager(
      videoContent, adsRenderingSettings);

  // Add listeners to the required events.
  adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(
      google.ima.AdEvent.Type.LOADED,
      onAdEvent);
}

function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
  // don't have ad object associated.
  const ad = adEvent.getAd();
  if (adEvent.type == google.ima.AdEvent.Type.LOADED && !ad.isLinear()) {
    // Start content when we've loaded a non-linear ad.
    videoContent.play();
  }
}

function onAdError(adErrorEvent) {
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  adsManager.destroy();
}

function onContentPauseRequested() {
  videoContent.pause();
  // This function is where you should setup UI for showing ads (e.g.
  // display ad timer countdown, disable seeking etc.)
  // setupUIForAds();
}

function onContentResumeRequested() {
  videoContent.play();
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();

}

// Wire UI element references and UI event listeners.
init();
