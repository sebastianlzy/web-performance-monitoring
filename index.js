const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const KeenTracking = require('keen-tracking');
const _ = require('lodash');
const program = require('commander');

program
  .version('0.1.0')
  .option('-p, --kpid <kpid>', 'Add keen project id')
  .option('-k, --kwk <kwk>', 'Add keen write key')
  .option('-u, --url <url>', 'Add the url to be tested')
  .parse(process.argv);
 
const getTodayDateTime = () => {
  const today = new Date();
  return `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}-${today.getHours()}:${today.getMinutes()}`
}

const calculateResourceSummary = (resources) => {
  return resources.reduce((acc, resource) => {
    if (!acc[resource.initiatorType]) {
      acc[resource.initiatorType] = {
        transferSize: 0,
        duration: 0,
        largestFileName: '',
        largestFileSize: 0,
        length: 0,
      }
    }
    let {
      transferSize,
      duration,
      length,
      largestFileSize
    } = acc[resource.initiatorType]

    
    if (largestFileSize <= resource.transferSize) {
      _.set(acc[resource.initiatorType], 'largestFileSize', resource.transferSize);
      _.set(acc[resource.initiatorType], 'largestFileName', resource.name);
    }
    _.set(acc[resource.initiatorType], 'transferSize', transferSize + resource.transferSize);
    _.set(acc[resource.initiatorType], 'duration', duration + resource.transferSize);
    _.set(acc[resource.initiatorType], 'length', length + 1);

    return acc;
  }, {})
}

const performanceEvaluate = () => {
  const result = {
    paint: {},
    navigation: {},
    resource: []
  };

  const navigations = _.get(performance.getEntriesByType('navigation'), '0')
  for (var key in navigations) {
    result['navigation'][key] = navigations[key]
  }

  result['paint'] = performance.getEntriesByType('paint').reduce((acc, entry) => {
    acc[entry.name] = entry.startTime;
    return acc;
  }, {});

  result['resource'] = performance.getEntriesByType('resource').map(entry => {
    const {
      connectEnd,
      connectStart,
      decodedBodySize,
      domainLookupEnd,
      domainLookupStart,
      duration,
      encodedBodySize,
      entryType,
      fetchStart,
      initiatorType,
      name,
      nextHopProtocol,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      startTime,
      transferSize,
      workerStart
    } = entry;

    return {
      connectEnd,
      connectStart,
      decodedBodySize,
      domainLookupEnd,
      domainLookupStart,
      duration,
      encodedBodySize,
      entryType,
      fetchStart,
      initiatorType,
      name,
      nextHopProtocol,
      redirectEnd,
      redirectStart,
      requestStart,
      responseEnd,
      responseStart,
      secureConnectionStart,
      startTime,
      transferSize,
      workerStart
    }

  })

  return result;
}

const isNecessaryArgumentProvided = (program) => {

  if(_.isEmpty(program.url)) {
      throw {msg: 'url is not defined'}
  }
  if(_.isEmpty(program.kpid)) {
      throw {msg: 'Keen project Id is not defined'}
  }
  if(_.isEmpty(program.kwk)) {
      throw {msg: 'Keen write key is not defined'}
  }
  return true;
}

try {
  isNecessaryArgumentProvided(program) 
}
catch (e){  
  console.error(e.msg);
  process.exit(1) 
}

async function getPerformance() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const perf = {}
  
  await page._client.send('Performance.enable');
  await page.setViewport({
    width: 1280,
    height: 664
  });

  try {
    await page.goto(program.url);
    perf['evaluate'] = await page.evaluate(performanceEvaluate);
    perf['metrics'] = await page.metrics();
    perf['resourceSummary'] = calculateResourceSummary(perf.evaluate.resource);

  } catch (e) {
    console.log('============================= e ========================');
    console.log('e -', e);
    console.log('============================= e ========================');
  }
  await browser.close();
  return perf
  
};



async function main() {
  const perf = await getPerformance();
  const client = new KeenTracking({
    projectId: '5a58690a46e0fb00018e379e',
    writeKey: 'CB043FF88095BB01FB5678004C39866A11ADE3D728F4864D8441905FE8435C7CFB67478FD8EBEAC499A21BB265FAE258022283D804A0B2245FC1243ACB611121C9F6B61217E5C08DA1658D904D9A0115F781C39758326A62A7E17C7911872AED'
  });

  client.recordEvent('performance', {url: program.url, ...perf}, () => (process.exit(0)));
  
}

main();

