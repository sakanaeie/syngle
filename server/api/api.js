function doGet(e) {
  switch (e.parameter.api) {
    case 'requestUrl':
      var result = GetController.requestUrl(e.parameter.url, e.parameter.password, e.parameter.isAddOnly);
      break;
    default:
      var result = new Schedule().getStatus();
      break;
  }

  return MyUtil.responseJsonp(e.parameter.callback, result);
}

var GetController = (function() {
  function requestUrl(url, password, isAddOnly) {
    isAddOnly = ('true' === isAddOnly) ? true : false;

    if (Config.password !== password) {
      return {message: 'パスワードが違います'};
    }

    var video = Youtube.fromUrl(url);
    if (video.tooManyRecentCalls) {
      return {message: 'YouTubeが検証リクエストを受理しませんでした。しばらく時間を置いてからお試しください。'};
    }
    if (null === video.id) {
      return {message: 'URLが不正です'};
    }
    if (null === video.response) {
      return {message: '指定の動画は削除されています'};
    }
    if (!video.canEmbed) {
      return {message: '指定の動画は埋め込みできません'};
    }

    if (!isAddOnly) {
      // スケジュールの末尾に追加する
      var schedule = new Schedule();
      var rowHash  = Sheet.makeRowHashFromVideo(video);

      if (schedule.isDuplicate(rowHash)) {
        return {message: '直近のスケジュールに含まれるため、リクエストを棄却しました'};
      } else {
        schedule.push(video);
      }
    }

    var sheet = new Sheet();
    if (!sheet.isDuplicate(video.id)) {
      sheet.add(video);
      if (isAddOnly) {
        return {message: 'マスタに追加しました'};
      } else {
        return {message: 'リクエストを受理し、マスタに追加しました'};
      }
    } else {
      if (isAddOnly) {
        return {message: '既にマスタに存在します'};
      } else {
        return {message: 'リクエストを受理しました'};
      }
    }
  }

  return {
    requestUrl: requestUrl,
  };
})();