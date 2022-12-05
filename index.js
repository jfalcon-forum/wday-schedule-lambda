import { CreateScheduleCommand, DeleteScheduleCommand, UpdateScheduleCommand, GetScheduleCommand } from "@aws-sdk/client-scheduler";
import { ebClient } from "./eventBridgeClient.js";

const scheduleEvent = async (event) => {
  
  let date = event.start.dateTime;
  let dateArr = date.split("T")
  let formattedDate = dateArr[0]
  
  let flex_window = { Mode: "OFF" };

  let sqs_templated = {
    RoleArn: process.env.ROLE_ARN,
    Arn: process.env.ARN,
    Input: JSON.stringify(event),
  };
  
  // event schedule should fire off half hour before event to allow space on schedule in case of failures

  const params = {
    Name: `${event.summary}-${formattedDate}`,
    ScheduleExpression: event.schedule,
    ScheduleExpressionTimezone: "America/Chicago",
    Target: sqs_templated,
    FlexibleTimeWindow: flex_window
  };

  try {
    const data = await ebClient.send(new CreateScheduleCommand(params));
    console.log("Success, scheduled rule created; Rule ARN:", data);
    return data;
  } catch (err) {
    console.log("Error", err);
    return err;
  }
};

const deleteScheduledEvent = async (name) => {
  // Docs say ClientToken can be empty but was throwing error when not filled
  const params = {
    Name: name,
    ClientToken: "23jnf"
  }
  
  try {
    const data = await ebClient.send(new DeleteScheduleCommand(params));
    console.log("Success, Deleted scheduled rule; Rule ARN:", data);
    return data;
  } catch (err) {
    console.log("Error", err);
    return err;
  }
}

const updateScheduledEvent = async (event) => {
  let flex_window = { Mode: "OFF" };

  let sqs_templated = {
    RoleArn: process.env.ROLE_ARN,
    Arn: process.env.ARN, 
    Input: JSON.stringify({
      event: event
    }),
  };

  const params = {
    Name: event.summary,
    ScheduleExpression: event.schedule,
    ScheduleExpressionTimezone: "America/Chicago",
    Target: sqs_templated,
    FlexibleTimeWindow: flex_window
  };

  try {
    const data = await ebClient.send(new UpdateScheduleCommand(params));
    console.log("Success, updated scheduled rule; Rule ARN:", data);
    return data;
  } catch (err) {
    console.log("Error", err);
    return err;
  }
}

const getScheduledEvent = async (name) => {
  const params = {
    Name: name,
  }
  
  try {
    const data = await ebClient.send(new GetScheduleCommand(params));
    console.log("Success, Scheduled Rule:", data);
    return data;
  } catch (err) {
    console.log("Error", err);
    return err;
  }
}

export const handler = async (event) => {
  if (event.method === "GET") {
    const result = await getScheduledEvent(event.query.name)
    return result
  } else if (event.method === "POST") {
    // Need a way to clean input in case of external api call
    const result = await scheduleEvent(event.body)
    return result
  } else if (event.method === "PUT") {
    const result = await updateScheduledEvent(event.body)
    return result
  } else if (event.method === "DELETE") {
    const result = await deleteScheduledEvent(event.query.name)
    return result
  } else {
    console.log("not supported")
    return {"type": "NOT SUPPORTED"}
  }
};
