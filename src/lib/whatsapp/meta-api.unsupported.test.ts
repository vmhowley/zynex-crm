import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendInteractiveButtons,
  sendInteractiveList,
  sendReactionMessage,
  sendTemplateMessage,
  UnsupportedChannelError,
} from "./meta-api";

const neverFetch = vi.fn(() => new Promise<Response>(() => {}));

describe("unsupported channel × operation matrix", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", neverFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sendReactionMessage throws UnsupportedChannelError on instagram", async () => {
    await expect(
      sendReactionMessage({
        channelId: "ig-1",
        messagingProduct: "instagram",
        accessToken: "t",
        to: "123",
        targetMessageId: "m",
        emoji: "👍",
      }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
  });

  it("sendReactionMessage throws BEFORE calling fetch", async () => {
    const spy = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", spy);
    await expect(
      sendReactionMessage({
        channelId: "ig-1",
        messagingProduct: "instagram",
        accessToken: "t",
        to: "123",
        targetMessageId: "m",
        emoji: "👍",
      }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("sendTemplateMessage throws UnsupportedChannelError on instagram", async () => {
    await expect(
      sendTemplateMessage({
        channelId: "ig-1",
        messagingProduct: "instagram",
        accessToken: "t",
        to: "123",
        templateName: "order_update",
      }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
  });

  it("sendInteractiveButtons throws UnsupportedChannelError on instagram", async () => {
    await expect(
      sendInteractiveButtons({
        channelId: "ig-1",
        messagingProduct: "instagram",
        accessToken: "t",
        to: "123",
        bodyText: "Hi",
        buttons: [{ id: "a", title: "A" }],
      }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
  });

  it("sendInteractiveList throws UnsupportedChannelError on instagram", async () => {
    await expect(
      sendInteractiveList({
        channelId: "ig-1",
        messagingProduct: "instagram",
        accessToken: "t",
        to: "123",
        bodyText: "Hi",
        buttonLabel: "Open",
        sections: [{ rows: [{ id: "r", title: "R" }] }],
      }),
    ).rejects.toBeInstanceOf(UnsupportedChannelError);
  });
});