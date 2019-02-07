export default function runningTaskFilter(t) {
  if (!(t.timestamp)) {
    // How did you get here without a timestamp
    // Assume that it never properly made it on the queue
    // Abandon ship
    console.log('Strange task found (is it in the queue?):', t);
    return false;
  }

  if (t.endTimestamp) {
    // You have an endTimestamp
    // Therefore you are done and presummably have a result
    // We could check for result here
    // But checking result requires parsing a json string
    // This check is above the below, because sometimes, we can get
    // booted from the queue without getting a startingTimestamp
    // In some of those circumstances we will have an endTimestamp
    // without a startingTimeStamp
    return false;
  }

  // We have a timestamp but no endTimestamp meaning it is at least in the queue
  if (!(t.startingTimestamp)) {
    // You don't have a startTimestamp
    // This means you are sitting in the queue waiting to fire
    // Techincally you are "running"
    return true;
  }

  // We have a timestamp, startingTimeStamp but no endTimestamp
  // So presumably you are being worked on, but how long is long enough?
  // Sometimes we lose tasks for one reason or another
  // We don't want to think things are running when errors never
  // got properly logged
  // Let's calculate the time since we started working on this task
  const startTime = new Date(t.startingTimestamp);
  const elapsedTimeDays = (Date.now() - startTime) / (1000 * 60 * 60 * 24);
  if (elapsedTimeDays > 2) {
    // If it has been actively worked on for more than 2 days we abandon ship
    console.log('Potential zombie task found: ', t);
    return false;
  }

  // Otherwise you are really running
  return true;
}
