import React, { useState } from "react";
import { Modal } from "~/components/Modal/index";
import { SvgFacebook, SvgTwitter, SvgReddit, SvgMail } from "~/assets/svg";

const ShareDialog: React.FC<{
  uri: string;
  name: string;
  active: boolean;
  close: () => void;
}> = ({ uri, name, active, close }) => {
  const shareUri = uri.startsWith("/") ? `${process.env.APP_URI}${uri}` : uri;
  const [copied, setCopied] = useState(false);

  function copy() {
    const copyText = document.querySelector("#shareUri") as HTMLInputElement;
    copyText.select();
    document.execCommand("copy");
    setCopied(true);
  }

  return (
    <Modal.Modal title="Share" active={active} onOutsideClick={close}>
      <Modal.Header>
        <Modal.Title>{name}</Modal.Title>
      </Modal.Header>
      <Modal.Content>
        <div className="flex items-center">
          <input
            id="shareUri"
            className="input w-full h-12"
            readOnly
            value={shareUri}
          />
          <button type="button" onClick={copy} className="button m-1 h-12">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-4">
          <p className="text-foreground-tertiary text-center">Share this via</p>
          <div className="flex flex-wrap place-center mt-4">
            <a
              title="Facebook"
              className="button h-12"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.facebook.com/dialog/share?app_id=${process.env.FACEBOOK_APP_ID}&href=${shareUri}&display=popup`}
            >
              <SvgFacebook fill="currentColor" strokeWidth="0" />
            </a>
            <a
              title="Twitter"
              className="button h-12 ml-2"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://twitter.com/intent/tweet?url=${shareUri}&text=${encodeURIComponent(
                name
              )}`}
            >
              <SvgTwitter fill="currentColor" strokeWidth="0" />
            </a>
            <a
              title="Reddit"
              className="button h-12 ml-2"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://reddit.com/submit?url=${shareUri}&title=${encodeURIComponent(
                name
              )}`}
            >
              <SvgReddit width="24" fill="currentColor" strokeWidth="0" />
            </a>
            <a
              title="Email"
              className="button h-12 ml-2"
              target="_blank"
              rel="noopener noreferrer"
              href={`mailto:?subject=${name}&body=${shareUri}`}
            >
              <SvgMail />
            </a>
          </div>
        </div>
      </Modal.Content>
    </Modal.Modal>
  );
};

export default ShareDialog;