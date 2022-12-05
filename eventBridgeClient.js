import { SchedulerClient } from "@aws-sdk/client-scheduler";

const REGION = "us-west-2";

export const ebClient = new SchedulerClient({ region: REGION });
