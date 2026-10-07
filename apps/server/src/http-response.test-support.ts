// Test-only status assertions must own the response body, not just its headers.
// Do not install a global dispatcher, fake Response or special keep-alive policy.
export async function responseStatus(response: Response | Promise<Response>): Promise<number> {
  const received = await response;
  await received.text();
  return received.status;
}
