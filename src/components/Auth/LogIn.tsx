import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import Router from "next/router";
import { Dialog } from "@reach/dialog";
import { useModal } from "~/components/Modal/index";
import { OAuthProviderName } from "~/graphql/gql.gen";
import { SvgSpotify, SvgGoogleColor } from "~/assets/svg";

const SignInContext = createContext<[boolean, () => void]>([
  false,
  () => undefined,
]);

enum AuthState {
  WAITING,
  CONNECTING,
  SUCCESS,
  FAIL,
}

const LogInModal: React.FC<{ active: boolean; close: () => void }> = ({
  active,
  close: closeModal,
}) => {
  const windowRef = useRef<Window | null>();
  const [isAuth, setIsAuth] = useState<AuthState>(AuthState.WAITING);

  const close = useCallback(() => {
    windowRef.current?.close();
    closeModal();
  }, [closeModal]);

  const logIn = useCallback((provider: OAuthProviderName) => {
    setIsAuth(AuthState.CONNECTING);
    windowRef.current = window.open(
      `${process.env.API_URI}/auth/${
        provider === OAuthProviderName.Youtube ? "google" : provider
      }`,
      "Login",
      "width=800,height=600"
    );

    let interval: number;

    new Promise<boolean>((resolve) => {
      interval = window.setInterval(() => {
        try {
          if (!windowRef.current || windowRef.current.closed)
            return resolve(false);
          if (windowRef.current.location.origin === process.env.APP_URI) {
            windowRef.current.close();
            resolve(true);
            const url = new URL(windowRef.current.location.href);
            if (url.searchParams.get("isNew")) Router.push("/welcome");
          }
        } catch (e) {
          // noop
        }
      }, 500);
    }).then((success) => {
      if (success) (window as any).resetUrqlClient();
      window.clearInterval(interval);
      setIsAuth(success ? AuthState.SUCCESS : AuthState.FAIL);
    });
  }, []);

  useEffect(() => {
    if (isAuth === AuthState.SUCCESS) {
      close();
      setIsAuth(AuthState.WAITING);
    }
  }, [isAuth, close]);

  return (
    <Dialog aria-label="Sign in to Stereo" isOpen={active} onDismiss={close}>
      <div className="container">
        <div className="text-center flex flex-col items-center px-2 py-24">
          <h1 className="text-3xl font-bold">Hellooo!</h1>
          <p
            className={`mb-4 ${
              isAuth === AuthState.CONNECTING ? "animate-pulse" : ""
            }`}
          >
            {isAuth === AuthState.CONNECTING &&
              "Connecting ~ Looking forward to seeing you soon ❤️"}
            {isAuth === AuthState.WAITING &&
              "Let's get you in with one of the methods below."}
            {isAuth === AuthState.FAIL && (
              <>
                <span className="bg-pink text-xs px-1 rounded-full">FAIL</span>{" "}
                Aww, things did not work out between us... That&apos;s okay,
                let&apos;s try again!
              </>
            )}
          </p>
          <div className="flex flex-wrap place-center">
            <div className="m-1 p-2 bg-white rounded-lg flex flex-col">
              <span className="text-black text-opacity-50 mb-1 text-xs">
                Listen on <b>YouTube</b>
              </span>
              <button
                onClick={() => logIn(OAuthProviderName.Youtube)}
                className="button bg-white text-black text-opacity-50 h-12"
                disabled={isAuth === AuthState.CONNECTING}
              >
                <SvgGoogleColor
                  width="24"
                  fill="currentColor"
                  strokeWidth="0"
                />
                <span className="ml-4 text-sm">Continue with Google</span>
              </button>
            </div>
            <div className="m-1 p-2 brand-spotify rounded-lg flex flex-col">
              <span className="text-white mb-1 text-xs">
                Listen on <b>Spotify</b>
              </span>
              <button
                onClick={() => logIn(OAuthProviderName.Spotify)}
                className="button brand-spotify h-12"
                disabled={isAuth === AuthState.CONNECTING}
              >
                <SvgSpotify width="24" fill="currentColor" strokeWidth="0" />
                <span className="ml-2 text-sm">Continue with Spotify</span>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-foreground-tertiary">
            <p>
              YouTube Premium lets you enjoy ad-free and background play. See{" "}
              <a
                style={{ color: "#ff0022" }}
                className="opacity-75 hover:opacity-100"
                href="https://www.youtube.com/premium"
              >
                youtube.com/premium
              </a>{" "}
              for more info.
            </p>
            <p>
              A Spotify subscription is required to play any track, ad-free. Go
              to{" "}
              <a
                style={{ color: "#1db954" }}
                className="opacity-75 hover:opacity-100"
                href="https://www.spotify.com/premium"
              >
                spotify.com/premium
              </a>{" "}
              to try it for free.
            </p>
          </div>
          <button className="mt-4 button" onClick={close}>
            Go back
          </button>
        </div>
        <p className="mx-auto w-128 max-w-full p-4 text-foreground-secondary text-xs text-center">
          By continuing, you agree to our{" "}
          <Link href="/privacy">
            <button className="underline" onClick={close}>
              Privacy Policy
            </button>
          </Link>{" "}
          as well as{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.youtube.com/t/terms"
            className="underline"
          >
            YouTube Terms of Service
          </a>{" "}
          and/or{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.spotify.com/us/legal/privacy-policy/"
            className="underline"
          >
            Spotify Privacy Policy
          </a>{" "}
          where applicable. Woa, you are a privacy-conscious person!
        </p>
      </div>
    </Dialog>
  );
};

export const LogInProvider: React.FC = ({ children }) => {
  const [active, open, close] = useModal();
  return (
    <>
      <SignInContext.Provider value={[active, open]}>
        {children}
        <LogInModal active={active} close={close} />
      </SignInContext.Provider>
    </>
  );
};

export const useLogin = () => {
  return useContext(SignInContext);
};