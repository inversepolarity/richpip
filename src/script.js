//TODO: destroy on navigate
//TODO: ensure subs respect window
//TODO: netflix captions
//TODO: restore subs on close
//TODO: yt miniplayer -> normal player subs lost
//TODO: yt vid dimensions from .html5-video-info-panel-content ytp-sfn-content for non 3:4 + issue from launching on cinema mode


async function requestPictureInPicture(video, videoParentElement, videoCssText, subs, miniplayerButton) {

  const pipWindow = await documentPictureInPicture.requestWindow({
    width: video.clientWidth,
    height: video.clientHeight,
  });


  [...document.styleSheets].forEach((styleSheet) => {
    // Copy style sheets over from the initial document
    // so that the player looks the same.
    try {
      const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
      const style = document.createElement('style');

      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch (e) {
      const link = document.createElement('link');

      link.rel = 'stylesheet';
      link.type = styleSheet.type;
      link.media = styleSheet.media;
      link.href = styleSheet.href;
      pipWindow.document.head.appendChild(link);
    }
  });

  let newVid = video;

  pipWindow.document.body.style.overflow = 'hidden';
  newVid.style.objectFit = "fill";

  pipWindow.document.body.append(newVid);

  subs && pipWindow.document.body.append(subs);

  pipWindow.addEventListener("pagehide", (event) => {
    destroyPipWindow(newVid, subs, videoParentElement, videoCssText);
  });

  pipWindow.addEventListener("resize", (e) => {
    console.log("🚀 ~ pipWindow.addEventListener ~ e:", e)

    videoCssText.preventMutTrigger = true;

    const w = e.target.window.innerWidth;
    const h = e.target.window.innerHeight;

    newVid.style.width = w + "px";
    newVid.style.height = h + "px";

    //minimums to prevent resize of content
    newVid.style.minWidth = w + "px";
    newVid.style.minHeight = h + "px";
    newVid.style.maxWidth = w + "px";
    newVid.style.maxHeight = h + "px";
  });

  newVid.setAttribute('__pip__', true);
  new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(newVid);
}

function destroyPipWindow(video, subs, videoParentElement, videoCssText) {
  video.style.cssText = videoCssText.prevStyle;
  video.removeAttribute('__pip__');
  videoParentElement.appendChild(video);
  subs && videoParentElement.appendChild(subs);
}

(async () => {

  const video = findLargestPlayingVideo();

  if (!video) {
    console.log('video not found')
    if (documentPictureInPicture.window != null) {
      documentPictureInPicture.window.close();
    }
    return;
  }

  const domain = window.location.hostname;

  let subs, miniplayerButton;

  if (domain.includes("youtube")) {
    subs = document.querySelectorAll("#ytp-caption-window-container")[0];
    miniplayerButton = document.querySelector('.ytp-miniplayer-button');
  }

  if (domain.includes("netflix")) {
    subs = document.querySelectorAll(".player-timedtext-text-container")[0];
  }

  let videoParentElement = video.parentElement;

  const videoCssText = { prevStyle: video.style.cssText, newStyle: null, preventMutTrigger: false };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "style" && !videoCssText.preventMutTrigger) {
        videoCssText.newStyle = video.style.cssText;
      }
    }
  });

  observer.observe(video, { attributes: true });
  await requestPictureInPicture(video, videoParentElement, videoCssText, subs, miniplayerButton);
})();