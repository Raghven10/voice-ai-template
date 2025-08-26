import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { SettingsDropdown } from "@/components/playground/SettingsDropdown";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionState } from "livekit-client";
import { ReactNode } from "react";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  githubLink?: string;
  height: number;
  accentColor: string;
  connectionState: ConnectionState;
  onConnectClicked: () => void;
};

export const PlaygroundHeader = ({
  logo,
  title,
  accentColor,
  height,
  onConnectClicked,
  connectionState,
}: PlaygroundHeader) => {
  const { config } = useConfig();
  return (
    <div
      className={`flex gap-4 pt-4 text-${accentColor}-500 justify-between items-center shrink-0`}
      style={{
        height: height + "px",
      }}
    >
      <div className="flex items-center gap-3 basis-2/3">
        <div className="flex lg:basis-1/2  border-gray-200 p-1">
          <a href="https://localhost:3000">{logo ?? <LKLogo />} </a>
        </div>
        <div className="lg:basis-1/2 lg:text-center text-2xl lg:text-base lg:font-semibold ">
          {title}
        </div>
      </div>
      <div className="flex basis-1/3 justify-end items-center gap-2">

        {config.settings.editable && <SettingsDropdown />}
        <Button
          accentColor={
            connectionState === ConnectionState.Connected ? "red" : "cyan"
          }
          disabled={connectionState === ConnectionState.Connecting}
          onClick={() => {
            onConnectClicked();
          }}
          className={'bg-blue-400 text-white hover:text-blue-500'}
        >
          {connectionState === ConnectionState.Connecting ? (
            <LoadingSVG />
          ) : connectionState === ConnectionState.Connected ? (
            "Disconnect"
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </div>
  );
};

const LKLogo = () => (
<img src={'./logo.jpg'} alt="Logo Logo" height={40} width={40} />
);
