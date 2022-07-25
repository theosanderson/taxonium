  import pako from "pako";
  import axios from "axios";
  import reduceMaxOrMin from "./reduceMaxOrMin";
 
  const emptyList = [];
  
  async function do_fetch(url, sendStatusMessage, whatIsBeingDownloaded) {
    if (!sendStatusMessage) {
      sendStatusMessage = () => {};
    }
    // send progress on downloadProgress
  
    if (url.endsWith(".gz")) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        onDownloadProgress: (progress) => {
          sendStatusMessage({
            message: "Downloading compressed " + whatIsBeingDownloaded,
            percentage: (progress.loaded / progress.total) * 100,
          });
        },
      });
      sendStatusMessage({
        message: "Decompressing compressed " + whatIsBeingDownloaded,
      });
      const inflated = pako.ungzip(response.data);
      const text = new TextDecoder("utf-8").decode(inflated);
      return text;
    } else {
      const response = await axios.get(url, {
        onDownloadProgress: (progress) => {
          sendStatusMessage({
            message: "Downloading " + whatIsBeingDownloaded,
            percentage: (progress.loaded / progress.total) * 100,
          });
        },
      });
      const text = response.data;
      //parse text:
      return text;
    }
  }
  
  function fetch_or_extract(file_obj, sendStatusMessage, whatIsBeingDownloaded) {
    if (file_obj.status === "url_supplied") {
      return do_fetch(
        file_obj.filename,
        sendStatusMessage,
        whatIsBeingDownloaded
      );
    } else if (file_obj.status === "loaded") {
      if (file_obj.filename.includes(".gz")) {
        const compressed_data = file_obj.data;
        sendStatusMessage({
          message: "Decompressing compressed " + whatIsBeingDownloaded,
        });
        const inflated = pako.ungzip(compressed_data);
        const text = new TextDecoder("utf-8").decode(inflated);
        return text;
      } else {
        // convert array buffer to string
        const text = new TextDecoder("utf-8").decode(file_obj.data);
        return text;
      }
    }
  }
  
  
  export async function processNextstrain(data, sendStatusMessage) {
    console.log("got data", data);
    let the_data;
  
    the_data = await fetch_or_extract(data, sendStatusMessage, "tree");
  
    sendStatusMessage({
      message: "Parsing NS file",
    });
    

    console.log("GOT DATA", the_data);


    const output = {
        "nodes": [
          {
            "name": "BGIOSIFCE006902.1_ORYSA",
            "parent_id": 1,
            "x_dist": 400.31188551729014,
            "mutations": [],
            "y": 0,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 0
          },
          {
            "name": "",
            "parent_id": 8,
            "x_dist": 235.28426064934868,
            "mutations": [],
            "y": 64.81481481481481,
            "num_tips": 4,
            "is_tip": false,
            "node_id": 1
          },
          {
            "name": "At4g19560.1_ARATH",
            "parent_id": 3,
            "x_dist": 449.99898902587586,
            "mutations": [],
            "y": 74.07407407407408,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 2
          },
          {
            "name": "",
            "parent_id": 1,
            "x_dist": 306.82382259426066,
            "mutations": [],
            "y": 129.62962962962962,
            "num_tips": 3,
            "is_tip": false,
            "node_id": 3
          },
          {
            "name": "At4g19600.1_ARATH",
            "parent_id": 5,
            "x_dist": 392.61584499744725,
            "mutations": [],
            "y": 148.14814814814815,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 4
          },
          {
            "name": "",
            "parent_id": 3,
            "x_dist": 334.57405132715627,
            "mutations": [],
            "y": 185.18518518518516,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 5
          },
          {
            "name": "At5g45190.1_ARATH",
            "parent_id": 5,
            "x_dist": 372.3766485196811,
            "mutations": [],
            "y": 222.2222222222222,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 6
          },
          {
            "name": "WBGene00009650_CAEEL",
            "parent_id": 9,
            "x_dist": 424.1316995991487,
            "mutations": [],
            "y": 296.2962962962963,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 7
          },
          {
            "name": "",
            "parent_id": 8,
            "x_dist": 0,
            "mutations": [],
            "y": 297.4627459490741,
            "num_tips": 28,
            "is_tip": false,
            "node_id": 8
          },
          {
            "name": "",
            "parent_id": 14,
            "x_dist": 376.9255265911469,
            "mutations": [],
            "y": 351.85185185185185,
            "num_tips": 3,
            "is_tip": false,
            "node_id": 9
          },
          {
            "name": "CBG04574_CAEBR",
            "parent_id": 11,
            "x_dist": 450,
            "mutations": [],
            "y": 370.3703703703703,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 10
          },
          {
            "name": "",
            "parent_id": 9,
            "x_dist": 396.21870403227024,
            "mutations": [],
            "y": 407.4074074074074,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 11
          },
          {
            "name": "cr01.sctg48.wum.67.1_CAERE",
            "parent_id": 11,
            "x_dist": 444.89988828735926,
            "mutations": [],
            "y": 444.4444444444444,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 12
          },
          {
            "name": "Smp_130980_SCHMA",
            "parent_id": 19,
            "x_dist": 246.92689140621445,
            "mutations": [],
            "y": 518.5185185185185,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 13
          },
          {
            "name": "",
            "parent_id": 8,
            "x_dist": 78.67299536468363,
            "mutations": [],
            "y": 530.1106770833334,
            "num_tips": 24,
            "is_tip": false,
            "node_id": 14
          },
          {
            "name": "CycK-RA_DROME",
            "parent_id": 16,
            "x_dist": 284.9476062660176,
            "mutations": [],
            "y": 592.5925925925926,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 15
          },
          {
            "name": "",
            "parent_id": 18,
            "x_dist": 240.16398000293182,
            "mutations": [],
            "y": 629.6296296296296,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 16
          },
          {
            "name": "dper_GLEANR_8777_caf1_DROPE",
            "parent_id": 16,
            "x_dist": 284.26191306633507,
            "mutations": [],
            "y": 666.6666666666666,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 17
          },
          {
            "name": "",
            "parent_id": 24,
            "x_dist": 189.71940413185123,
            "mutations": [],
            "y": 703.7037037037036,
            "num_tips": 4,
            "is_tip": false,
            "node_id": 18
          },
          {
            "name": "",
            "parent_id": 14,
            "x_dist": 89.16513756830395,
            "mutations": [],
            "y": 708.3695023148149,
            "num_tips": 21,
            "is_tip": false,
            "node_id": 19
          },
          {
            "name": "AAEL013531-RA_AEDAE",
            "parent_id": 21,
            "x_dist": 288.92806413619843,
            "mutations": [],
            "y": 740.7407407407406,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 20
          },
          {
            "name": "",
            "parent_id": 18,
            "x_dist": 234.80783909335838,
            "mutations": [],
            "y": 777.7777777777777,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 21
          },
          {
            "name": "XP_317464_ANOGA",
            "parent_id": 21,
            "x_dist": 286.4777156028691,
            "mutations": [],
            "y": 814.8148148148148,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 22
          },
          {
            "name": "ENSCINT00000017473_CIOIN",
            "parent_id": 25,
            "x_dist": 260.2707388704386,
            "mutations": [],
            "y": 888.8888888888888,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 23
          },
          {
            "name": "",
            "parent_id": 19,
            "x_dist": 115.62586880588792,
            "mutations": [],
            "y": 898.2204861111112,
            "num_tips": 20,
            "is_tip": false,
            "node_id": 24
          },
          {
            "name": "",
            "parent_id": 28,
            "x_dist": 260.2707388704386,
            "mutations": [],
            "y": 925.9259259259259,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 25
          },
          {
            "name": "ENSCINT00000026852_CIOIN",
            "parent_id": 25,
            "x_dist": 260.8629169636403,
            "mutations": [],
            "y": 962.9629629629629,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 26
          },
          {
            "name": "ENSGACT00000017400_GASAC",
            "parent_id": 29,
            "x_dist": 314.4938305304076,
            "mutations": [],
            "y": 1037.037037037037,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 27
          },
          {
            "name": "",
            "parent_id": 24,
            "x_dist": 138.5982338282052,
            "mutations": [],
            "y": 1092.7372685185187,
            "num_tips": 16,
            "is_tip": false,
            "node_id": 28
          },
          {
            "name": "",
            "parent_id": 35,
            "x_dist": 212.49917858352418,
            "mutations": [],
            "y": 1101.851851851852,
            "num_tips": 4,
            "is_tip": false,
            "node_id": 29
          },
          {
            "name": "si_dkey-60a16_F2_BRARE",
            "parent_id": 31,
            "x_dist": 268.16164465270515,
            "mutations": [],
            "y": 1111.111111111111,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 30
          },
          {
            "name": "",
            "parent_id": 29,
            "x_dist": 231.97003472696122,
            "mutations": [],
            "y": 1166.6666666666667,
            "num_tips": 3,
            "is_tip": false,
            "node_id": 31
          },
          {
            "name": "CCNK_TETNG",
            "parent_id": 33,
            "x_dist": 301.0867971834262,
            "mutations": [],
            "y": 1185.1851851851852,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 32
          },
          {
            "name": "",
            "parent_id": 31,
            "x_dist": 265.0382400962448,
            "mutations": [],
            "y": 1222.2222222222224,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 33
          },
          {
            "name": "CCNK_F2_GASAC",
            "parent_id": 33,
            "x_dist": 294.29305106935794,
            "mutations": [],
            "y": 1259.2592592592594,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 34
          },
          {
            "name": "",
            "parent_id": 28,
            "x_dist": 197.73870362788068,
            "mutations": [],
            "y": 1259.548611111111,
            "num_tips": 14,
            "is_tip": false,
            "node_id": 35
          },
          {
            "name": "CCNK_XENTR",
            "parent_id": 38,
            "x_dist": 261.27236148390784,
            "mutations": [],
            "y": 1333.3333333333333,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 36
          },
          {
            "name": "NP_001026380_CHICK",
            "parent_id": 40,
            "x_dist": 253.34228045433179,
            "mutations": [],
            "y": 1407.4074074074074,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 37
          },
          {
            "name": "",
            "parent_id": 35,
            "x_dist": 216.84030147248382,
            "mutations": [],
            "y": 1417.2453703703702,
            "num_tips": 10,
            "is_tip": false,
            "node_id": 38
          },
          {
            "name": "CCNK_MONDO",
            "parent_id": 43,
            "x_dist": 262.8702060870752,
            "mutations": [],
            "y": 1481.4814814814813,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 39
          },
          {
            "name": "",
            "parent_id": 38,
            "x_dist": 231.85351995915667,
            "mutations": [],
            "y": 1501.1574074074074,
            "num_tips": 9,
            "is_tip": false,
            "node_id": 40
          },
          {
            "name": "Ccnk_MOUSE",
            "parent_id": 42,
            "x_dist": 285.80036293971057,
            "mutations": [],
            "y": 1555.5555555555557,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 41
          },
          {
            "name": "",
            "parent_id": 46,
            "x_dist": 281.2047273150044,
            "mutations": [],
            "y": 1592.5925925925926,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 42
          },
          {
            "name": "",
            "parent_id": 40,
            "x_dist": 245.3153986523715,
            "mutations": [],
            "y": 1594.9074074074074,
            "num_tips": 8,
            "is_tip": false,
            "node_id": 43
          },
          {
            "name": "LOC500715_RAT",
            "parent_id": 42,
            "x_dist": 288.0995708414843,
            "mutations": [],
            "y": 1629.6296296296296,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 44
          },
          {
            "name": "CCNK_BOVIN",
            "parent_id": 47,
            "x_dist": 290.2941429214119,
            "mutations": [],
            "y": 1703.7037037037037,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 45
          },
          {
            "name": "",
            "parent_id": 43,
            "x_dist": 267.49414898725666,
            "mutations": [],
            "y": 1708.3333333333333,
            "num_tips": 7,
            "is_tip": false,
            "node_id": 46
          },
          {
            "name": "",
            "parent_id": 49,
            "x_dist": 277.78889849314305,
            "mutations": [],
            "y": 1740.7407407407406,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 47
          },
          {
            "name": "CCNK_CANFA",
            "parent_id": 47,
            "x_dist": 297.22057938927054,
            "mutations": [],
            "y": 1777.7777777777776,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 48
          },
          {
            "name": "",
            "parent_id": 46,
            "x_dist": 270.97189997422015,
            "mutations": [],
            "y": 1824.074074074074,
            "num_tips": 5,
            "is_tip": false,
            "node_id": 49
          },
          {
            "name": "CCNK_MACMU",
            "parent_id": 51,
            "x_dist": 279.2136137775554,
            "mutations": [],
            "y": 1851.851851851852,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 50
          },
          {
            "name": "",
            "parent_id": 49,
            "x_dist": 276.11245065182555,
            "mutations": [],
            "y": 1907.4074074074074,
            "num_tips": 3,
            "is_tip": false,
            "node_id": 51
          },
          {
            "name": "CCNK_HUMAN",
            "parent_id": 53,
            "x_dist": 278.8087186408464,
            "mutations": [],
            "y": 1925.9259259259259,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 52
          },
          {
            "name": "",
            "parent_id": 51,
            "x_dist": 278.4672621304258,
            "mutations": [],
            "y": 1962.9629629629628,
            "num_tips": 2,
            "is_tip": false,
            "node_id": 53
          },
          {
            "name": "CCNK_F3_PANTR",
            "parent_id": 53,
            "x_dist": 278.86861885770037,
            "mutations": [],
            "y": 2000,
            "num_tips": 1,
            "is_tip": true,
            "node_id": 54
          }
        ],
        "overallMaxX": 450,
        "overallMaxY": 2000,
        "overallMinX": 0,
        "overallMinY": 0,
        "y_positions": [
          0,
          64.81481481481481,
          74.07407407407408,
          129.62962962962962,
          148.14814814814815,
          185.18518518518516,
          222.2222222222222,
          296.2962962962963,
          297.4627459490741,
          351.85185185185185,
          370.3703703703703,
          407.4074074074074,
          444.4444444444444,
          518.5185185185185,
          530.1106770833334,
          592.5925925925926,
          629.6296296296296,
          666.6666666666666,
          703.7037037037036,
          708.3695023148149,
          740.7407407407406,
          777.7777777777777,
          814.8148148148148,
          888.8888888888888,
          898.2204861111112,
          925.9259259259259,
          962.9629629629629,
          1037.037037037037,
          1092.7372685185187,
          1101.851851851852,
          1111.111111111111,
          1166.6666666666667,
          1185.1851851851852,
          1222.2222222222224,
          1259.2592592592594,
          1259.548611111111,
          1333.3333333333333,
          1407.4074074074074,
          1417.2453703703702,
          1481.4814814814813,
          1501.1574074074074,
          1555.5555555555557,
          1592.5925925925926,
          1594.9074074074074,
          1629.6296296296296,
          1703.7037037037037,
          1708.3333333333333,
          1740.7407407407406,
          1777.7777777777776,
          1824.074074074074,
          1851.851851851852,
          1907.4074074074074,
          1925.9259259259259,
          1962.9629629629628,
          2000
        ],
        "mutations": [],
        "node_to_mut": {},
        "rootMutations": [],
        "rootId": 0,
        "overwrite_config": {
          "num_tips": 28
        }
      }
  
    return output;
  }
  
  
  
  