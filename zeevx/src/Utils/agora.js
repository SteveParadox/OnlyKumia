import {createClient, createMicrophoneAndCameraTracks} from "agora-rtc-sdk-ng";

const appId = "d30f3c4f1618400697c9ba5e9d7e3d36"
const token = "007eJxTYLj502KtY4btg8dbX536xcTxokTckGFV3uLSzhMfnbd7/jypwJBibJBmnGySZmhmaGFiYGBmaZ5smZRommqZYp5qnGJstvcbf1pDICPD7ozNDIxQCOKzMOQmZuYxMAAAEFAiEQ=="


export const config = { mode: "rtc", codec: "vp8", appId:appId, token:token};
export const useClient = createClient(config);
export const useMicrophoneAndCameraTracks = createMicrophoneAndCameraTracks();
export const channelName = "main";