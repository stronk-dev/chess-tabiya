/**
 * The shared dependency-free macrotask yield ([[D2029]]; rfc/bounded-policy-targets.md §4.1).
 *
 * One `MessageChannel` post per yield with both ports closed afterwards, so a long local traversal
 * lets the event loop run timers and abort listeners between chunks. Imported by the bounded-target
 * service; no feature module re-implements it or imports another feature module to reach it.
 */
export function messageChannelMacrotaskYield(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let channel: MessageChannel;
    try {
      channel = new MessageChannel();
    } catch (error) {
      reject(error);
      return;
    }
    channel.port1.onmessage = () => {
      channel.port1.onmessage = null;
      channel.port1.close();
      channel.port2.close();
      resolve();
    };
    channel.port2.postMessage(undefined);
  });
}
