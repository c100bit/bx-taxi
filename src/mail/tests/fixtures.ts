import { readFile } from 'fs/promises';
import { Message, MessageAttachment } from 'yapople';

const buildAttachment = async () => {
  const content = await readFile(
    require('path').resolve(__dirname, './fixtures/attachment.xml'),
  );

  const attachment: MessageAttachment = {
    contentType: 'contentType',
    fileName: 'fileName',
    transferEncoding: 'transferEncoding',
    contentDisposition: 'contentDisposition',
    contentId: 'contentId',
    generatedFileName: 'generatedFileName',
    checksum: 'checksum',
    length: 10,
    content: content,
  };

  return attachment;
};

export const createMsg = async () => {
  const attachment = await buildAttachment();
  const msg: Message = {
    html: 'html',
    text: 'text',
    headers: { key: 'val' },
    subject: 'Report',
    references: [],
    messageId: 'msgId',
    inReplyTo: [],
    priority: 'priority',
    from: [{ address: 'source@localhost', name: 'source@localhost' }],
    replyTo: [{ address: 'address', name: 'name' }],
    to: [{ address: 'address', name: 'name' }],
    date: new Date(1994, 11, 11, 1, 11, 0),
    receivedDate: new Date(1994, 11, 11, 1, 11, 0),
    attachments: [attachment],
  };

  return msg;
};
