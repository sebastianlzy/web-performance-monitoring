
let filename = './traceProfile/trace.json';
let events = require('fs').readFileSync(filename, 'utf8');

let DevtoolsTimelineModel = require('devtools-timeline-model');
let summary = require("./performance-browser-summary");
// events can be either a string of the trace data or the JSON.parse'd equivalent

const parseEvents = JSON.parse(events);
summary.onData(parseEvents.traceEvents);
// summary.report('a');

let model = new DevtoolsTimelineModel(events);
// tracing model
// console.log(model.tracingModel());
// timeline model, all events
// console.log(model.timelineModel());
// interaction model, incl scroll, click, animations
// console.log(model.interactionModel());
// frame model, incl frame durations
// console.log(model.frameModel());
// filmstrip model, incl screenshots
// console.log(model.filmStripModel());

// topdown tree
// console.log(model.topDown());
// bottom up tree
// console.log(model.bottomUp());
// bottom up tree, grouped by URL
// console.log(model.bottomUpGroupBy('URL'));
model.bottomUpGroupBy('Category');