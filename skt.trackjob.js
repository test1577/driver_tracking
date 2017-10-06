/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global FB_PIXEL, mixpanel, MIXPANEL, google, SKT_MAIN, SKT_TRACKJOB.firebase.initObj.fb, firebase, SKT, SKT_TRACKING */

var SKT_TRACKJOB = {
  initObj: {
  },
  init: function () {
    SKT_TRACKING.page.trackJob.viewPage();
    SKT_TRACKJOB.google.init();
//    SKT_TRACKJOB.google.testClick();
    SKT_TRACKJOB.btn.click();
    SKT_TRACKJOB.job.getStatus();
  },
  hide: function (el) {
    $(el).hide();
  },
  btn: {
    click: function () {
      $(".btn-newuser").click(function () {
        window.location.href = SKT_MAIN.baseUrl();
      });
      $("#btnShowMassenger").click(function () {
        SKT_TRACKJOB.google.focusMarkerMassenger(SKT_TRACKJOB.google.initObj.locationMassenger);
      });
      $("#btnShowLocation").click(function () {
        SKT_TRACKJOB.google.focusLocationOnMap();
      });
    }
  },
  job: {
    initObj: {
      data: {},
      jobStatusText: {
        0: "ยกเลิก",
        1: "ใหม่",
        10: "สร้างใบแจ้งหนี้แล้ว",
        11: "ชำระค่าบริการแล้ว",
        2: "กำลังตรวจสอบ",
        3: "ตรวจสอบผ่าน",
        4: "ระบบกำลังหาคนขับ",
        5: "มีคนขับแล้ว",
        6: "กำลังไปรับของ",
        7: "กำลังไปส่งของ",
        9: "งานสำเร็จ"
      }
    },
    setHtml: function (data) {
      var env = SKT_MAIN.env();
      var uriEnv = env === "dev" ? "/dev_test" : "";
      $("#jobId").html(data.jobId);
      $("#jobStatus").html(data.jobStatusTh);
      $("#skId").html(data.skootarId);
      $("#skName").html(data.skootarName);
      var numbers = (data.skootarPhone).split("-");
      var phone = "";
      for (var item in numbers) {
        phone += numbers[item];
      }
      $(".phone").html("<a href='tel:" + phone + "'><span>" + phone + "</span></a>");
      var imageDriverUrl = "http://www.skootar.com" + uriEnv + "/messengerImage?skootarId=" + data.skootarId;
      $("#skPhoto").attr("src", imageDriverUrl);
      $("#score").html("(" + data.skootarRating + "/5)");
//          locationList
      $("#btnShowLocation").show();
      var percent = data.skootarRating * 20;
      $(".wrap").css({width: percent + "%"});
      if (data.startTime.length > 0 && data.jobStatus >= 5 && data.jobStatus <= 7 && data.skootarId !== null) {
        $("#btnShowMassenger").show();
      } else {
        $("#btnShowMassenger").hide();
      }
      if (data.jobStatus >= SKT.JOB.STATUS.JOB_SKOOTAR_ACCEPT) {
        $(".massenger").addClass("display");
      }
    },
    updateStatus: function (status) {
      var job = SKT_TRACKJOB.job.initObj.data;
      if (SKT_TRACKJOB.job.initObj.data.jobStatus !== status) {
//      if (job.startTime.length > 0 && job.jobStatus >= 5 && job.jobStatus <= 7 && job.skootarId !== null) {
//        window.location.reload();
        SKT_TRACKJOB.job.getStatus();
      }
//      $("#jobStatus").html(SKT_TRACKJOB.job.initObj.jobStatusText[status]);
    },
    getStatus: function () {
      var t = window.location.search.substring(1);
      $.get(SKT_MAIN.baseUrl() + "getTrackjob?t=" + t, function (data, status) {
        var dataResult = JSON.parse(data.data);
//        dataResult.skootarId = "SK2869";
        if (typeof dataResult !== "undefined" && dataResult !== null) {
          SKT_TRACKJOB.job.initObj.data = dataResult;
          SKT_TRACKJOB.job.setHtml(dataResult);
          SKT_TRACKJOB.google.addMarker(dataResult.locationList);
          SKT_TRACKJOB.google.updateDrawMapResult(dataResult.locationList);
          SKT_TRACKJOB.firebase.init(dataResult);
        }
      });
    }
  },
  firebase: {
    initObj: {
      fb: {},
      jobStatus: null,
      env: SKT_MAIN.env() === "prod" ? "skootar_prod" : "skootar_dev"
    },
    init: function (job) {
      SKT_TRACKJOB.firebase.jobStatus.init(job.jobId);
      SKT_TRACKJOB.firebase.massengerPhoto.init(job);
      SKT_TRACKJOB.firebase.massengerLocation.init(job);
    },
    jobStatus: {
      init: function (jobId) {
        if (jobId !== null) {
          SKT_TRACKJOB.firebase.initObj.jobStatus = firebase.database().ref(SKT_TRACKJOB.firebase.initObj.env + "/Job/" + jobId);
          if (typeof SKT_TRACKJOB.firebase.initObj.jobStatus !== "undifined" && SKT_TRACKJOB.firebase.initObj.jobStatus !== null) {
            SKT_TRACKJOB.firebase.initObj.jobStatus.off();
          }
          SKT_TRACKJOB.firebase.initObj.jobStatus.on('value', function (snapshot) {
            var jobResult = snapshot.val();
            if (jobResult !== null) {
              SKT_TRACKJOB.job.updateStatus(jobResult.Status);
            }
          });
        }

      }
    },
    massengerPhoto: {
      init: function (job) {
        var imageUrl = SKT_MAIN.baseUrl() + "messengerImage?skootarId=" + job.skootarId;
        $(".sk-photo").attr("src", imageUrl);
      }
    },
    massengerLocation: {
      init: function (job) {
        if (job.startTime.length > 0 && job.jobStatus >= 5 && job.jobStatus <= 7 && job.skootarId !== null) {
//                    if (job.jobStatus >= 5 && job.skootarId !== null) { // for test
          SKT_TRACKJOB.firebase.initObj.fb.starCountRef = firebase.database().ref(SKT_TRACKJOB.firebase.initObj.env + "/tracking/" + job.skootarId);
          if (typeof SKT_TRACKJOB.firebase.initObj.fb.starCountRef !== "undifined") {
            SKT_TRACKJOB.firebase.initObj.fb.starCountRef.off();
          }
          SKT_TRACKJOB.firebase.initObj.fb.starCountRef.on('value', function (snapshot) {
            var lo = snapshot.val();
            if (lo !== null) {
              SKT_TRACKJOB.google.initObj.locationMassenger[0]["lat"] = lo.lat;
              SKT_TRACKJOB.google.initObj.locationMassenger[0]["lng"] = lo.lng;
              SKT_TRACKJOB.google.updateMarkerMassenger2(SKT_TRACKJOB.google.initObj.locationMassenger);
            }
          });
        }
      }
    }
  },
  google: {
    initObj: {
      map: null,
      bound: new google.maps.LatLngBounds(),
      directionsDisplay: new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#0B1F4E"
        }
      }),
      directionsService: new google.maps.DirectionsService(),
      mapZoom: 15,
      locationMassenger: [{
          lat: null,
          lng: null
        }],
      option: null,
      massengerMarker: [],
      listMarker: [],
      infowindow: new google.maps.InfoWindow,
      transitionMarkerConfig: {
        packLocationList: {},
        numDeltas: 100,
        delay: 10,
        startLoop: 0,
        deltaLat: 0,
        deltaLng: 0
      }
    },
    init: function () {
//      var initStartPoint = new google.maps.LatLng(lat,lng);
      var initStartPoint = new google.maps.LatLng(13.8081405, 100.5741528);
      var mapOptions = {
        zoom: SKT_TRACKJOB.google.initObj.mapZoom,
        zoomControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        streetViewControl: false,
        center: initStartPoint
      };
      SKT_TRACKJOB.google.initObj.map = new google.maps.Map(document.getElementById("trackMap"), mapOptions);
    },
    updateDrawMapResult: function (locationList) {
      let start = "";
      let end = "";
      let waypts = [];
      for (var j = 0; j < locationList.length; j++) {
        if (j === 0) {
          start = new google.maps.LatLng(locationList[j].lat, locationList[j].lng);
        } else if (j === locationList.length - 1) {
          end = new google.maps.LatLng(locationList[j].lat, locationList[j].lng);
        } else {
          waypts.push({
            location: new google.maps.LatLng(locationList[j].lat, locationList[j].lng),
            stopover: true
          });
        }
      }
      SKT_TRACKJOB.google.drawMapResult(start, end, waypts);
    },
    drawMapResult: function (start, end, waypts) {
      var hasWayPts = false;
      if (waypts.length > 0) {
        hasWayPts = true;
      }
      SKT_TRACKJOB.google.initObj.directionsService.route({
        origin: start,
        destination: end,
        waypoints: waypts,
        optimizeWaypoints: hasWayPts,
        travelMode: 'DRIVING'
      }, function (response, status) {
        if (status === 'OK') {
          SKT_TRACKJOB.google.initObj.directionsDisplay.setMap(SKT_TRACKJOB.google.initObj.map);
          SKT_TRACKJOB.google.initObj.directionsDisplay.setDirections(response);
        }
      });
    },
    addMarker: function (lists) {
      for (var i = 0; i < lists.length; i++) {
        var myLatLng = new google.maps.LatLng(lists[i].lat, lists[i].lng);
        let textLabel = "จุดที่ : " + (i + 1) + " : " + lists[i]["addressName"] + lists[i]["address"];
        SKT_TRACKJOB.google.initObj.bound.extend(myLatLng);
        var imagePath = '/images/v2/trackjob/s-point.png';
        var imageSize = [20, 23];
        if (i === (lists.length - 1)) {
          imagePath = '/images/v2/trackjob/e-point.png';
          imageSize = [20, 30];
        }
        var image = new google.maps.MarkerImage(
                SKT_MAIN.baseUrl() + imagePath,
                null,
                null,
                null,
                new google.maps.Size(imageSize[0], imageSize[1])
                );
        SKT_TRACKJOB.google.initObj.listMarker.push(new google.maps.Marker({
          flat: true,
          icon: image,
          label: {text: " " + (i + 1), color: "white"},
          map: SKT_TRACKJOB.google.initObj.map,
          optimized: false,
          position: myLatLng,
          visible: true
        }));
        SKT_TRACKJOB.google.initObj.map.fitBounds(SKT_TRACKJOB.google.initObj.bound);
//        info map when click marker
        google.maps.event.addListener(SKT_TRACKJOB.google.initObj.listMarker[i], 'click', (function (marker, i, myLatLng) {
          return function () {
//                 SKT_TRACKJOB.google.initObj.infowindow.setContent(lists[i].content);
            SKT_TRACKJOB.google.initObj.infowindow.setContent(textLabel);
            SKT_TRACKJOB.google.initObj.infowindow.open(SKT_TRACKJOB.google.initObj.map, marker[i]);
          };
        })(SKT_TRACKJOB.google.initObj.listMarker, i, myLatLng));
      }
    },
    updateMarkerMassenger: function (lists) {
      var myLatLng = new google.maps.LatLng(lists[0].lat, lists[0].lng);
      if (SKT_TRACKJOB.google.initObj.massengerMarker.length > 0) {
        SKT_TRACKJOB.google.initObj.massengerMarker[0].setPosition(myLatLng);
        return;
      }
      var image = new google.maps.MarkerImage(
              SKT_MAIN.baseUrl() + '/images/v2/trackjob/sk.png',
              null,
              null,
              null,
              new google.maps.Size(30, 30)
              );
      SKT_TRACKJOB.google.initObj.massengerMarker.push(new google.maps.Marker({
        flat: true,
        icon: image,
        map: SKT_TRACKJOB.google.initObj.map,
        optimized: false,
        position: myLatLng,
        visible: true
      }));
    },
    transition: function (result) {
      SKT_TRACKJOB.google.initObj.transitionMarkerConfig.startLoop = 0;
      SKT_TRACKJOB.google.initObj.transitionMarkerConfig.deltaLat = (result[0] - SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition().lat()) / SKT_TRACKJOB.google.initObj.transitionMarkerConfig.numDeltas;
      SKT_TRACKJOB.google.initObj.transitionMarkerConfig.deltaLng = (result[1] - SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition().lng()) / SKT_TRACKJOB.google.initObj.transitionMarkerConfig.numDeltas;
      SKT_TRACKJOB.google.moveMarker();
    },
    moveMarker: function () {
      let lat = SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition().lat();
      let lng = SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition().lng();
      lat += SKT_TRACKJOB.google.initObj.transitionMarkerConfig.deltaLat;
      lng += SKT_TRACKJOB.google.initObj.transitionMarkerConfig.deltaLng;
      let latlng = new google.maps.LatLng(lat, lng);
      SKT_TRACKJOB.google.initObj.massengerMarker[0].setPosition(latlng);
      if (SKT_TRACKJOB.google.initObj.transitionMarkerConfig.startLoop !== SKT_TRACKJOB.google.initObj.transitionMarkerConfig.numDeltas) {
        SKT_TRACKJOB.google.initObj.transitionMarkerConfig.startLoop++;
        setTimeout(function(){
          SKT_TRACKJOB.google.moveMarker();
        }, SKT_TRACKJOB.google.initObj.transitionMarkerConfig.delay);
      }
    },
    testClick: function () {
      google.maps.event.addListener(SKT_TRACKJOB.google.initObj.map, 'click', function (me) {
        var prevPosn = SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition();
        SKT_TRACKJOB.google.initObj.transitionMarkerConfig.packLocationList = {
          old: {
            lat: prevPosn.lat(),
            lng: prevPosn.lng()
          },
          new : {
            lat: me.latLng.lat(),
            lng: me.latLng.lng()
          }
        };
        var result = [me.latLng.lat(), me.latLng.lng()];
        SKT_TRACKJOB.google.transition(result);
        var rotate = Math.floor(google.maps.geometry.spherical.computeHeading(prevPosn, me.latLng));
        var imageUrl = SKT_MAIN.baseUrl() + 'images/v2/trackjob/sk.png';
        $($('img[src="' + imageUrl + '"]')[0]).css({
          transition: 'transform 500ms',
          transform: 'rotate(' + rotate + 'deg)'
        });
      });
    },
    updateMarkerMassenger2: function (lists) {
      var myLatLng = new google.maps.LatLng(lists[0].lat, lists[0].lng);
      if (SKT_TRACKJOB.google.initObj.massengerMarker.length > 0) {
        var prevPosn = SKT_TRACKJOB.google.initObj.massengerMarker[0].getPosition();
//        SKT_TRACKJOB.google.initObj.massengerMarker[0].setPosition(myLatLng);
        var rotate = Math.floor(google.maps.geometry.spherical.computeHeading(prevPosn, myLatLng));
        var imageUrl = SKT_MAIN.baseUrl() + 'images/v2/trackjob/sk.png';
        $($('img[src="' + imageUrl + '"]')[0]).css({
          transition: 'transform 1s',
          transform: 'rotate(' + rotate + 'deg)'
        });
        var result = [lists[0].lat, lists[0].lng];
        SKT_TRACKJOB.google.transition(result);
        return;
      }
      SKT_TRACKJOB.google.initObj.massengerMarker.push(new google.maps.Marker({
        flat: true,
        icon: {
          url: SKT_MAIN.baseUrl() + 'images/v2/trackjob/sk.png',
//          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          strokeColor: 'red',
          strokeWeight: 3,
          scale: 6,
          rotation: 0
        },
        map: SKT_TRACKJOB.google.initObj.map,
        optimized: false,
        position: myLatLng,
        visible: true
      }));
    },
    focusMarkerMassenger: function (lists) {
      var myLatLng = new google.maps.LatLng(lists[0].lat, lists[0].lng);
      SKT_TRACKJOB.google.initObj.map.panTo(myLatLng);
    },
    focusLocationOnMap: function () {
      SKT_TRACKJOB.google.initObj.map.fitBounds(SKT_TRACKJOB.google.initObj.bound);
    }
  }
};
jQuery(document).ready(SKT_TRACKJOB.init);