import HeadContent from "@/components/headContent";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { FaGear,FaRankingStar, FaYoutube } from "react-icons/fa6";
import { signOut, useSession } from "@/components/auth/auth";
import 'react-responsive-modal/styles.css';
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/ui/navbar";
import GameUI from "@/components/gameUI";
import BannerText from "@/components/bannerText";
import findLatLongRandom from "@/components/findLatLong";
import Link from "next/link";
import MultiplayerHome from "@/components/multiplayerHome";
import AccountModal from "@/components/accountModal";
import SetUsernameModal from "@/components/setUsernameModal";
import ChatBox from "@/components/chatBox";
import React from "react";
import countryMaxDists from '../public/countryMaxDists.json';
import { useTranslation } from '@/components/useTranslations'
import useWindowDimensions from "@/components/useWindowDimensions";
import Ad from "@/components/bannerAd";
import Script from "next/script";
import SettingsModal from "@/components/settingsModal";
import sendEvent from "@/components/utils/sendEvent";
import initWebsocket from "@/components/utils/initWebsocket";
import 'react-toastify/dist/ReactToastify.css';

import NextImage from "next/image";
import OnboardingText from "@/components/onboardingText";
import RoundOverScreen from "@/components/roundOverScreen";
import msToTime from "@/components/msToTime";
import SuggestAccountModal from "@/components/suggestAccountModal";
import FriendsModal from "@/components/friendModal";
import { toast, ToastContainer } from "react-toastify";
import InfoModal from "@/components/infoModal";
import { inIframe, isForbiddenIframe } from "@/components/utils/inIframe";
import moment from 'moment-timezone';
import MapsModal from "@/components/maps/mapsModal";
import { useRouter } from "next/router";
import { fromLonLat } from "ol/proj";
import { boundingExtent } from "ol/extent";

import countries from "@/public/countries.json";
import officialCountryMaps from "@/public/officialCountryMaps.json";

import fixBranding from "@/components/utils/fixBranding";
import gameStorage from "@/components/utils/localStorage";
import DiscordModal from "@/components/discordModal";
import MerchModal from "@/components/merchModal";
import clientConfig from "@/clientConfig";
import { useGoogleLogin } from "@react-oauth/google";
import LeagueModal from "./leagueModal";
import haversineDistance from "./utils/haversineDistance";


let tempat = [];
const initialMultiplayerState = {
  connected: false,
  connecting: false,
  shouldConnect: false,
  gameQueued: false,
  inGame: false,
  nextGameQueued: false,
  enteringGameCode: false,
  createOptions: {
    rounds: 10,
    timePerRound: 30,
    location: "all",
    displayLocation: "All countries",
    progress: false
  },
  joinOptions: {
    gameCode: null,
    progress: false,
    error: false
  }
}

export default function Home({ }) {
  const { width, height } = useWindowDimensions();

  const [hintgambar, sethintgambar] = useState({ gambar1: "", gambar2: "" })
  const [session, setSession] = useState(false);
  const { data: mainSession } = useSession();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(false);
  // game state
  const [latLong, setLatLong] = useState({ lat: 0, long: 0 })
  const [streetViewShown, setStreetViewShown] = useState(false)
  const [gameOptionsModalShown, setGameOptionsModalShown] = useState(false);
  // location aka map slug
  const [gameOptions, setGameOptions] = useState({ location: "all", maxDist: 20000, official: true, countryMap: false, communityMapName: "", extent: null, showRoadName: true }) // rate limit fix: showRoadName true
  const [showAnswer, setShowAnswer] = useState(false)
  const [pinPoint, setPinPoint] = useState(null)
  const [hintShown, setHintShown] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [countryStreak, setCountryStreak] = useState(0)
  const [settingsModal, setSettingsModal] = useState(false)
  const [mapModal, setMapModal] = useState(false)
  const [friendsModal, setFriendsModal] = useState(false)
  const [merchModal, setMerchModal] = useState(false)
  const [timeOffset, setTimeOffset] = useState(0)
  const [loginQueued, setLoginQueued] = useState(false);
  const [options, setOptions] = useState({
  });
  const [multiplayerError, setMultiplayerError] = useState(null);
  const [miniMapShown, setMiniMapShown] = useState(false)  

  let login = null;
  if(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
   // eslint-disable-next-line react-hooks/rules-of-hooks
   login = useGoogleLogin({
    onSuccess: tokenResponse => {
      fetch(clientConfig().apiUrl+"/api/googleAuth", {
        body: JSON.stringify({ code: tokenResponse.code }),
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((res) => res.json()).then((data) => {
        if(data.secret) {

          setSession({ token: data })
          window.localStorage.setItem("wg_secret", data.secret)

        } else {
          toast.error("Login error, contact support if this persists (2)")
        }

      }).catch((e) => {
        console.error("google auth error", e)
        toast.error("Login error, contact support if this persists (3)")
      })
    },
    onError: error => {
      toast.error("Login error, contact support if this persists")
      console.log("login error", error);
    },
    onNonOAuthError: error => {
      console.log("login non oauth error", error);
      toast.error("Login error, contact support if this persists (1)\n\nMake sure popups are enabled (needed for google window)")

    },
    flow: "auth-code",

  });

  if(typeof window !== "undefined") window.login = login;
}




  const [isApp, setIsApp] = useState(false);
  const [inCrazyGames, setInCrazyGames] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [leagueModal, setLeagueModal] = useState(false);

  const [legacyMapLoader, setLegacyMapLoader] = useState(true);

  useEffect(() => {

    console.log("game options",(gameOptions?.showRoadName===true))
    if((gameOptions?.showRoadName===true) && !gameOptions?.nm &&  !gameOptions?.npz) {

      console.log("showing road name")
      setLegacyMapLoader(true); // rate limit fix: uselegacymaploader
      // setLegacyMapLoader(false);
    } else {

      console.log("hiding road name")
      setLegacyMapLoader(false);
    }
  }, [gameOptions?.nm, gameOptions?.npz,gameOptions?.showRoadName])

  useEffect(() => {

    if (!inCrazyGames) {
      setSession(mainSession)
    }
  }, [JSON.stringify(mainSession), inCrazyGames])

  // this breaks stuff like logout and set username reloads
  // useEffect(() => {
  //   window.onbeforeunload = function(e) {
  //     if(screen === "home") {

  //     } else  {
  //       e.preventDefault();
  //       return e.returnValue = 'Are you sure you want to leave?';
  //     }
  //   }
  // }, [screen])



  const [config, setConfig] = useState(null);
  const [eloData, setEloData] = useState(null);
  const [animatedEloDisplay, setAnimatedEloDisplay] = useState(0);
  useEffect(() => {
    if(!session?.token?.username) return;
    if(!leagueModal && window.firstFetchElo) return;

    fetch(clientConfig().apiUrl+"/api/eloRank?username="+session?.token?.username).then((res) => res.json()).then((data) => {
      setEloData(data)
      window.firstFetchElo = true;
    }).catch((e) => {
      window.firstFetchElo = true;
    });



  }, [session?.token?.username, leagueModal])
  useEffect(() => {
    if (!eloData?.elo) return;

    const interval = setInterval(() => {
      setAnimatedEloDisplay((prev) => {
        prev = parseInt(prev.toString().replace(/,/g, ""));
        const diff = eloData.elo - prev;

        // Determine the step based on the difference
        const step = Math.ceil(Math.abs(diff) / 10) || 1; // Minimum step is 1

        // Smooth animation
        if (diff > 0) return Math.min(prev + step, eloData.elo);
        if (diff < 0) return Math.max(prev - step, eloData.elo);
        return prev;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [eloData?.elo]);
  useEffect(() => {
    const clientConfigData = clientConfig();
    setConfig(clientConfigData);
    window.cConfig = clientConfigData;

    if(window.location.search.includes("app=true")) {
      setIsApp(true);
    }
    if(window.location.search.includes("instantJoin=true")) {
      // crazygames
    }


    async function crazyAuthListener() {
      console.log("crazygames auth listener")
      const user = await window.CrazyGames.SDK.user.getUser();
      if(user) {
        console.log("crazygames user", user)
        const token = await window.CrazyGames.SDK.user.getUserToken();
        if(token && user.username) {
          // /api/crazyAuth
          fetch(clientConfigData.apiUrl+"/api/crazyAuth", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, username: user.username })
          }).then((res) => res.json()).then((data) => {
        console.log("crazygames auth", token, user, data)
            try {
            window.CrazyGames.SDK.game.loadingStop();
            } catch(e) {}
            if(data.secret && data.username) {
              setSession({ token: { secret: data.secret, username: data.username } })
              // verify the ws
              window.verifyPayload = JSON.stringify({ type: "verify", secret: data.secret, username: data.username });

              setWs((prev) => {

                if(prev) {
                  console.log("sending verify")

                  prev.send(window.verifyPayload)
                }
                return prev;
              });
            } else {
              toast.error("CrazyGames auth failed")
            }
          }).catch((e) => {
            try {
            window.CrazyGames.SDK.game.loadingStop();
            } catch(e) {}
            console.error("crazygames auth failed", e)
          });

        }
      } else {
        console.log("crazygames user not logged in")
        // user not logged in
        // verify with not_logged_in
        window.verifyPayload = JSON.stringify({ type: "verify", secret: "not_logged_in", username: "not_logged_in" });
        setWs((prev) => {
          if(prev) {
            prev.send(window.verifyPayload)
          } else {
            console.log("no ws, waiting for connection")
          }
          return prev;
        });
      }
    }

    function finish() {
      const onboardingCompletedd = gameStorage.getItem("onboarding");
      console.log("onboarding", onboardingCompletedd)
      if(onboardingCompletedd !== "done") startOnboarding();
      else setOnboardingCompleted(true)

      if(window.location.search.includes("map=")) {
            // get map slug map=slug from url
            const params = new URLSearchParams(window.location.search);
            const mapSlug = params.get("map");
            setScreen("singleplayer")

            openMap(mapSlug)
      }
          }
    if(window.location.search.includes("crazygames")) {
      setInCrazyGames(true);
      window.inCrazyGames = true;
      setLoading(true)

      window.onCrazyload = () => {

      // initialize the sdk
      try {
        console.log("init crazygames sdk", window.CrazyGames)

         window.CrazyGames.SDK.init().then(async () => {
          console.log("sdk initialized")
          setLoading(false)
          try {
          window.CrazyGames.SDK.game.loadingStart();
          } catch(e) {}

          crazyAuthListener().then(() => {
            // check if onboarding is done
            finish()
          })


          window.CrazyGames.SDK.user.addAuthListener(crazyAuthListener);

         }).catch((e) => {
          finish()
          console.error("crazygames sdk init failed", e)
          setLoading(false)
        })
      } catch(e) {
        console.error("crazygames sdk init failed", e)
        finish()
        setLoading(false)
      }
    }

    if(window.CrazyGames) {
      window.onCrazyload();
    }
    }
    initialMultiplayerState.createOptions.displayLocation = text("allCountries")

    return () => {
      try {
        window.CrazyGames.SDK.user.removeAuthListener(crazyAuthListener);
      } catch(e){
        console.error("crazygames remove auth listener error", e)
      }
    }

  }, []);

  const [onboarding, setOnboarding] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [otherOptions, setOtherOptions] = useState([]); // for country guesser
  const [showCountryButtons, setShowCountryButtons] = useState(true);
  const [countryGuesserCorrect, setCountryGuesserCorrect] = useState(false);

  const [showSuggestLoginModal, setShowSuggestLoginModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [singlePlayerRound, setSinglePlayerRound] = useState(null);
  const [partyModalShown, setPartyModalShown] = useState(false);
  useEffect(() => {
    if(screen === "singleplayer") {
      // start the single player game
      setSinglePlayerRound({
        round: 1,
        totalRounds: 10,
        locations: [],
      })
    }
  }, [screen])

  const [allLocsArray, setAllLocsArray] = useState([]);
  function startOnboarding() {

    if(inCrazyGames) {
      // make sure its not an invite link
      const code = window.CrazyGames.SDK.game.getInviteParam("code")
      if(code && code.length === 6) {
        return;
      }

      // make sure tis not already completed
      const onboarding = gameStorage.getItem("onboarding");
      if(onboarding === "done") {
        return;
      }
    }

    setScreen("home");
setScreen("onboarding");
//manual location
// let onboardingLocations = [
//   { id: 1, lat: -6.2607743, long: 106.9582372, country: "ID", otherOptions: ["GB", "JP"], 
//     gambar1:"https://e7.pngegg.com/pngimages/683/416/png-clipart-number-cute-number-one-orange-and-red-star-print-number-1-illustration-text-orange-thumbnail.png",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png" },
//   {  id: 2, lat: -0.2217275, long: 101.5210505, country: "IN", otherOptions: ["ZA", "FR"], 
//     gambar1:"https://images.tokopedia.net/img/cache/700/VqbcmM/2022/10/4/d62bafd6-ea56-459b-baee-c7ef33273e11.jpg",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png" },
//   {  id: 3, lat: -5.2439598, long: 119.9033266, country: "GB", otherOptions: ["US", "DE"], 
//     gambar1:"https://kleur-v-kind.com/wp-content/uploads/2024/08/Labubu-kleurplaat-afdrukken-gratis.jpg",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png" },
//   {  id: 4, lat: -8.5250799, long: 115.4022668, country: "RU", otherOptions: ["CN", "PL"], 
//     gambar1:"https://png.pngtree.com/png-vector/20230531/ourmid/pngtree-baby-girl-character-coloring-pages-with-a-black-background-vector-png-image_6791862.png",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png" },
//   {  id: 5, lat: -1.5747405, long: 112.752362, country: "EG", otherOptions: ["TR", "BR"] , 
//     gambar1:"https://www.shutterstock.com/image-photo/hej-ai-kan-du-lave-260nw-2505641255.jpg",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},
//   {  id: 6, lat: -3.1649837, long: 135.6448855, country: "FR", otherOptions: ["IT", "ES"] , 
//     gambar1:"https://www.shutterstock.com/image-vector/cute-panda-dabbing-pose-cartoon-260nw-2471990065.jpg",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},
//   {  id: 7, lat: 5.5545318, long: 95.3179168, country: "US", otherOptions: ["CA", "AU"] , 
//     gambar1:"https://down-id.img.susercontent.com/file/sg-11134201-22120-vl9npwvvakkv65",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},

//   {  id: 8, lat: 2.7394102, long: 98.7080656, country: "ID", otherOptions: ["GB", "JP"] , 
//     gambar1:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlczgL6OC1SuXyZBZaxjGwTbFS7gHu2EOAYQ&s",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},
//   {  id: 9, lat: -0.3051166, long: 100.3694161, country: "IN", otherOptions: ["ZA", "FR"] , 
//     gambar1:"https://png.pngtree.com/png-vector/20230726/ourmid/pngtree-coloring-pages-free-kids-printable-teddy-bear-drawing-in-pencil-cartoon-png-image_6746133.png",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},
//   {  id: 10, lat: 0.7941924, long: 102.048504, country: "GB", otherOptions: ["US", "DE"] , 
//     gambar1:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgrj6gu0cGKuQYCBF8Z6cryLKL1YUZfpsm1w&s",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},
//   {  id: 11, lat: 0.9816344, long: 104.0415744, country: "RU", otherOptions: ["CN", "PL"] , 
//     gambar1:"https://berita.99.co/wp-content/uploads/2023/09/sketsa-gambar-bunga-simple.jpg",
//     gambar2:"https://banner2.cleanpng.com/20190306/xab/kisspng-clip-art-number-image-text-animation-2-16the-blessed-ocdiva-2-16-5c803e4c897a45.9161582915519084285631.jpg",
//     gambar3:"https://img.lovepik.com/element/45015/5482.png_860.png"},

// ]
let onboardingLocations = [
  { namatempat : "Papua",lat: -2.5833022650989226, long: 140.65201920195216, country: "BR", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/papua_sagu_lempeng.jpeg",
    gambar2:"http://localhost:3000/img/house/papua_honai.jpg",
    gambar3:"http://localhost:3000/img/clothes/papua_koteka.jpg",
    makanan: "Sagu Lempeng",
    rumah:"Honai",
    baju:"Koteka"
  },
  { namatempat : "Sumatra Barat", lat: -0.47204688487525476,  long: 100.62061937564968, country: "PH", otherOptions: ["US", "DE"], 
    gambar1:"http://localhost:3000/img/food/sumbar_rendang.jpg",
    gambar2:"http://localhost:3000/img/house/sumbar_rumah_gadang.jpg",
    gambar3:"http://localhost:3000/img/clothes/sumbar_baju_bundo_kanduang.jpg",
    makanan: "Rendang",
    rumah:"Rumah Gadang",
    baju:"Bundo Kanduang"
  },
  { namatempat : "Jawa Tengah",lat: -7.608031601482493,  long: 110.20586349000051, country: "KE", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/jateng_brekecek.jpg",
    gambar2:"http://localhost:3000/img/house/jateng_joglo.jpg",
    gambar3:"http://localhost:3000/img/clothes/jateng_jawi_jangkep.jpeg",
    makanan: "Brekecek",
    rumah:"Joglo",
    baju:"Jawi Jangkep"
  },
  { namatempat : "Kalimantan Barat",lat: -0.04807051782454185, long:109.34328181050776 , country: "NZ", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/kalbar_pengkang.jpg",
    gambar2:"http://localhost:3000/img/house/kalbar_rumah_panjang.jpg",
    gambar3:"http://localhost:3000/img/clothes/kalbar_king_baba.jpg",
    makanan: "Pengkang",
    rumah:"Rumah Panjang",
    baju:"King Baba"
  },
  { namatempat : "Sulawesi Selatan",lat: -5.143486217586571,  long: 119.40769776777869, country: "CO", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/sulsel_coto_makassar.jpg",
    gambar2:"http://localhost:3000/img/house/sulsel_tongkonan.jpg",
    gambar3:"http://localhost:3000/img/clothes/sulsel_baju_bodo.jpeg",
    makanan: "Coto Makassar",
    rumah:"Tongkonan",
    baju:"Baju Bodo"
  },
  { namatempat : "Maluku",lat: -3.6491913740652104,  long: 128.19361318605112, country: "MY", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/maluku_papeda.jpeg",
    gambar2:"http://localhost:3000/img/house/maluku_baileo.jpg",
    gambar3:"http://localhost:3000/img/clothes/maluku_baju_cele.jpg",
    makanan: "Papeda",
    rumah:"Baileo",
    baju:"Baju Cele"
  },
  { namatempat : "Lampung",lat:-5.429283673533707,  long: 105.26141342976521, country: "IN", otherOptions: ["ZA", "FR"] , 
    gambar1:"http://localhost:3000/img/food/lampung_seruit.jpg",
    gambar2:"http://localhost:3000/img/house/lampung_rumah_nuwo_sesat.jpg",
    gambar3:"http://localhost:3000/img/clothes/lampung_baju_sai_batin.jpeg",
    makanan: "Seruit",
    rumah:"Rumah Nuwo Sesat",
    baju:"Sai Batin"
  },
  { namatempat : "Nusa Tenggara Timur",lat: -9.42506217761972, long: 119.24644139884707, country: "AT", otherOptions: ["CN", "PL"] , 
    gambar1:"http://localhost:3000/img/food/ntt_sei.jpg",
    gambar2:"http://localhost:3000/img/house/ntt_rumah_musalaki.jpeg",
    gambar3:"http://localhost:3000/img/clothes/ntt_amarasi.jpg",
    makanan: "Sei",
    rumah:"Rumah Musalaki",
    baju:"Amarasi"
  },
  
  ]
// pick 5 random locations no repeats
const locations = [];
const gambaranbanyak = [];
while (locations.length < 5) {
  const loc = onboardingLocations[Math.floor(Math.random() * onboardingLocations.length)]
  if (!locations.find((l) => l.country === loc.country)) {
    locations.push(loc)
  }
}

setOnboarding({
  round: 1,
  locations: locations,
  startTime: Date.now(),
  gambar1: locations.gambar1,
  gambar2: locations.gambar2,
  gambar3: locations.gambar3,
})
sendEvent("tutorial_begin")
setShowCountryButtons(false)
}
  function openMap(mapSlug) {
    const country = countries.find((c) => c === mapSlug.toUpperCase());
    let officialCountryMap = null;
    if(country) {
    officialCountryMap = officialCountryMaps.find((c) => c.countryCode === mapSlug);
    }
    setAllLocsArray([])

    if(!country && mapSlug !== gameOptions.location) {
      if( ((window?.lastPlayTrack||0) + 20000 < Date.now())) {

        try {
      fetch(clientConfig()?.apiUrl+`/mapPlay/${mapSlug}`, {method: "POST"})
        } catch(e) {}

    }

    try {
      window.lastPlayTrack = Date.now();
      } catch(e) {}
    }

    setGameOptions((prev) => ({
      ...prev,
      location: mapSlug,
      official: (country||mapSlug==='all') ? true : false,
      countryMap: country,
      maxDist: country ? countryMaxDists[country] : 20000,
      extent: country && officialCountryMap && officialCountryMap.extent ? officialCountryMap.extent : null
    }))
  }

  useEffect(() => {
    if(onboarding?.round >1) {
      loadLocation()
    }
  }, [onboarding?.round])

  useEffect(() => {
    if(onboarding?.completed) {
      setOnboardingCompleted(true)
    }
  }, [onboarding?.completed])
  useEffect(() => {
    try {
    const onboarding = gameStorage.getItem("onboarding");
    // check url
    const cg = window.location.search.includes("crazygames");
    const specifiedMapSlug = window.location.search.includes("map=");
    console.log("onboarding", onboarding, specifiedMapSlug)
    // make it false just for testing
    // gameStorage.setItem("onboarding", null)
    if(onboarding && onboarding === "done") {
      setOnboardingCompleted(true)


    }
      else if(specifiedMapSlug && !cg) setOnboardingCompleted(true)
      else setOnboardingCompleted(false)
  } catch(e) {
    console.error(e, "onboard");
    setOnboardingCompleted(true);
  }
  setOnboardingCompleted(false)
  }, [])



  useEffect(() => {

    // check if pirated
    if(isForbiddenIframe() && !window.blocked) {
      // display a message
      window.blocked = true;
      document.write(`
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Play WorldGuessr</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body, html {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: url('http://localhost:3000/img/home_wp.jpg') no-repeat center center/cover;
      font-family: 'Arial', sans-serif;
    }

    .container {
      text-align: center;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 30px;
      border-radius: 10px;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
    }

    a {
      text-decoration: none;
    }

    .play-button {
      background-color: #2563eb;
      color: white;
      padding: 15px 30px;
      font-size: 1.5rem;
      border-radius: 50px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .play-button:hover {
      background-color: #1d4ed8;
      transform: scale(1.05);
    }

    .play-button:active {
      background-color: #1e40af;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to WorldGuessr!</h1>
    <a href="https://worldguessr.com" target="_blank">
      <button class="play-button">Open in New Tab ↗</button>
    </a>
  </div>
</body>
</html>
`)
      sendEvent("blocked_iframe")
    }
    // check if learn mode
    if(window.location.search.includes("learn=true")) {
      window.learnMode = true;

      // immediately open single player
      setScreen("singleplayer")
    }
    // check if from map screen
    if(window.location.search.includes("map=") && !window.location.search.includes("crazygames")) {
      // get map slug map=slug from url
      const params = new URLSearchParams(window.location.search);
      const mapSlug = params.get("map");
      setScreen("singleplayer")

      openMap(mapSlug)
    }

    if(window.location.search.includes("createPrivateGame=true")) {
    }
  }, [])

  useEffect(() => {

// check if learn mode
    if(window.location.search.includes("learn=true")) {
      setOnboardingCompleted(true)
    }


    if(onboardingCompleted === false) {
      if(onboardingCompleted===null)return;
      if (!loading) {


      // const isPPC = window.location.search.includes("cpc=true");
        if(inIframe() && window.adBreak && !inCrazyGames) {
          console.log("trying to show preroll")
          window.onboardPrerollEnd = false;
          setLoading(true)
          window.adBreak({
            type: "preroll",
            adBreakDone: function(e) {
              if(window.onboardPrerollEnd) return;
              setLoading(false)
              window.onboardPrerollEnd = true;
              sendEvent("interstitial", { type: "preroll", ...e })
              startOnboarding()
            }
          })

          setTimeout(() => {
            if(!window.onboardPrerollEnd) {
              window.onboardPrerollEnd = true;
              console.log("preroll timeout")
              setLoading(false)
              startOnboarding()
            }
          }, 3000)
        } else if(!inCrazyGames) {

          startOnboarding()
        }
      }
    }
  }, [onboardingCompleted])

  useEffect(() => {
    if(session && session.token && session.token.username && !inCrazyGames) {
      setOnboardingCompleted(true)
      try {
        gameStorage.setItem("onboarding", 'done')
      } catch(e) {}
    }
  }, [session])

  useEffect(() => {
    if(!options?.language) return;
    try {
      window.localStorage.setItem("lang", options?.language)
      window.language = options?.language;
      console.log("set lang", options?.language)
      const currentQueryParams = new URLSearchParams(window.location.search);
      const qPsuffix = currentQueryParams.toString() ? `?${currentQueryParams.toString()}` : "";

      const location = `/${options?.language !== "en" ? options?.language : ""}`
      if(!window.location.pathname.includes(location)) {
        console.log("changing lang", location)
        window.location.href = location+qPsuffix;
      }
      if(options?.language === "en" && ["es", "fr", "de", "ru",'id'].includes(window.location.pathname.split("/")[1])) {
        console.log("changing lang", location)
        window.location.href = "/"+qPsuffix;
      }
    } catch(e) {}
  }, [options?.language]);

  const loadOptions =async () => {

    // try to fetch options from localstorage
    try {
    const options = gameStorage.getItem("options");
    console.log("options", options)


    if (options) {
      setOptions(JSON.parse(options))
    } else {
      let json;

      try {
      const res = await fetch("https://ipapi.co/json/");
       json = await res.json();
      }catch(e){}

      const countryCode = json?.country_code;
      let system = "metric";
      if(countryCode && ["US", "LR", "MM", "UK"].includes(countryCode)) system = "imperial";


      setOptions({
        units: system,
        mapType: "m" //m for normal
      })
    }
  } catch(e) {}

  }
  useEffect(()=>{loadOptions()}, [])

  useEffect(() => {
    if(options && options.units && options.mapType) {
      try {
      gameStorage.setItem("options", JSON.stringify(options))
      } catch(e) {}
    }
  }, [options])

  useEffect(() => {
    window.disableVideoAds = options?.disableVideoAds;
  }, [options?.disableVideoAds]);

  // multiplayer stuff
  const [ws, setWs] = useState(null);
  const [multiplayerState, setMultiplayerState] = useState(
    initialMultiplayerState
  );
  const [multiplayerChatOpen, setMultiplayerChatOpen] = useState(false);
  const [multiplayerChatEnabled, setMultiplayerChatEnabled] = useState(false);

  useEffect(() => {
    if(!session?.token?.secret) return;

    // verify the ws
    if(ws && !window.verified && !window.location.search.includes("crazygames")) {
      console.log("sending verify", ws)
      ws.send(JSON.stringify({ type: "verify", secret: session.token.secret, username: session.token.username }))
    }
  }, [session?.token?.secret, ws])

  const { t: text } = useTranslation("common");

  useEffect(( ) => {

    if(multiplayerState?.joinOptions?.error) {
      setTimeout(() => {
        setMultiplayerState((prev) => ({ ...prev, joinOptions: { ...prev.joinOptions, error: null } }))
      }, 1000)
    }

  }, [multiplayerState?.joinOptions?.error]);


  function handleMultiplayerAction(action, ...args) {
    if (!ws || !multiplayerState.connected || multiplayerState.gameQueued || multiplayerState.connecting) return;

    if (action === "publicDuel") {
      setScreen("multiplayer")
      setMultiplayerState((prev) => ({
        ...prev,
        gameQueued: "publicDuel",
        nextGameQueued: false
      }))
      sendEvent("multiplayer_request_duel")
      ws.send(JSON.stringify({ type: "publicDuel" }))
    }

    if (action === "joinPrivateGame") {

      if (args[0]) {
        setScreen("multiplayer")

        setMultiplayerState((prev) => ({
          ...prev,
          joinOptions: {
            ...prev.joinOptions,
            error: false,
            progress: true
          }
        }));
        // join Party
        ws.send(JSON.stringify({ type: "joinPrivateGame", gameCode: args[0] }))
      sendEvent("multiplayer_join_private_game", { gameCode: args[0] })

      } else {
        setScreen("multiplayer")
        setMultiplayerState((prev) => {
          return {
            ...initialMultiplayerState,
            connected: true,
            enteringGameCode: true,
            playerCount: prev.playerCount,
            guestName: prev.guestName
          }

        })
      }
    }

    if (action === "createPrivateGame") {

        // const maxDist = args[0].location === "all" ? 20000 : countryMaxDists[args[0].location];
        // setMultiplayerState((prev) => ({
        //   ...prev,
        //   createOptions: {
        //     ...prev.createOptions,
        //     progress: 0
        //   }
        // }));
        // (async () => {
          // const locations = [];
          // for (let i = 0; i < args[0].rounds; i++) {

          //   const loc = await findLatLongRandom({ location: multiplayerState.createOptions.location });
          //   locations.push(loc)
          //   setMultiplayerState((prev) => ({
          //     ...prev,
          //     createOptions: {
          //       ...prev.createOptions,
          //       progress: i + 1
          //     }
          //   }))
          // }

          setMultiplayerState((prev) => ({
            ...prev,
            createOptions: {
              ...prev.createOptions,
              progress: true
            }
          }));

          // send ws
          // ws.send(JSON.stringify({ type: "createPrivateGame", rounds: args[0].rounds, timePerRound: args[0].timePerRound, locations, maxDist }))
          ws.send(JSON.stringify({ type: "createPrivateGame"

          }));
          setPartyModalShown(true)
          sendEvent("multiplayer_create_private_game")
          // })()
    }

    if(action === "setPrivateGameOptions" && multiplayerState?.inGame && multiplayerState?.gameData?.host && multiplayerState?.gameData?.state === "waiting") {
    setMultiplayerState((prev) => {
      ws.send(JSON.stringify({ type: "setPrivateGameOptions", rounds: prev.createOptions.rounds, timePerRound: prev.createOptions.timePerRound, nm: prev.createOptions.nm, npz: prev.createOptions.npz, showRoadName: prev.createOptions.showRoadName, location: prev.createOptions.location, displayLocation: prev.createOptions.displayLocation }))
      return prev;
    })
    }

    if (action === 'startGameHost' && multiplayerState?.inGame && multiplayerState?.gameData?.host && multiplayerState?.gameData?.state === "waiting") {
      ws.send(JSON.stringify({ type: "startGameHost" }))
      sendEvent("multiplayer_start_game_host")
    }

    if(action === 'screen') {
        ws.send(JSON.stringify({ type: "screen", screen: args[0] }))
    }


  }

  useEffect(() => {
    (async() => {


    if (!ws && !multiplayerState.connecting && !multiplayerState.connected && !window?.dontReconnect) {

      setMultiplayerState((prev) => ({
        ...prev,
        connecting: true,
        shouldConnect: false
      }))
      const ws = await initWebsocket(clientConfig().websocketUrl, null, 5000, 20)
      if(ws && ws.readyState === 1) {
      setWs(ws)
      setMultiplayerState((prev)=>({
        ...prev,
        error: false
      }))


      console.log("connected to ws", window.verifyPayload)
      if(!inCrazyGames && !window.location.search.includes("crazygames")) {

          const tz = moment.tz.guess();
          let secret = "not_logged_in";
          try {
            const s = window.localStorage.getItem("wg_secret");
            if(s) {
              secret = s;
            }
          } catch(e) {
          }
          if(session?.token?.secret) {
            secret = session.token.secret;
          }


          if(secret !== "not_logged_in") {
            window.verified = true;
          }
          ws.send(JSON.stringify({ type: "verify", secret, tz}))
      } else if(window.verifyPayload) {
        console.log("sending verify from verifyPayload")
        ws.send(window.verifyPayload)


      }
      } else {
        alert("could not connect to server")
      }

    }
  })();
  }, [multiplayerState, ws, screen])

  useEffect(() => {

    if(inCrazyGames || window.poki) {
      if(screen === "home") {
        console.log("gameplay stop")
        try {
          window.CrazyGames.SDK.game.gameplayStop();
        } catch(e) {}
        try {
          if(window.poki) window.PokiSDK.gameplayStop();
        } catch(e) {}
      } else {
        console.log("gameplay start")
        try {
          window.CrazyGames.SDK.game.gameplayStart();
        } catch(e) {}
        try {
          if(window.poki) window.PokiSDK.gameplayStart();
        } catch(e) {}
      }
    }
  }, [screen, inCrazyGames])

  useEffect(() => {
    if(multiplayerState?.connected && inCrazyGames) {

          // check if joined via invite link
          try {
            let code = window.CrazyGames.SDK.game.getInviteParam("code")
            let instantJoin = window.location.search.includes("instantJoin");



            if(code || instantJoin) {

              if(typeof code === "string") {
                try {
                  code = parseInt(code)
                } catch(e) {
                }
              }

            setOnboardingCompleted(true)
            setOnboarding(null)
            setLoading(false)
            setScreen("home")
            if(code) {

              // join Party
              handleMultiplayerAction("joinPrivateGame")
              // set the code
              setMultiplayerState((prev) => ({
                ...prev,
                joinOptions: {
                  ...prev.joinOptions,
                  gameCode: code,
                  progress: true
                }
              }))
              // press go
              setTimeout(() => {
                handleMultiplayerAction("joinPrivateGame", code)
              }, 1000)
            } else {
              // create Party
              handleMultiplayerAction("createPrivateGame")
            }

            }

            } catch(e) {}

    }
  }, [multiplayerState?.connected, inCrazyGames])

  useEffect(() => {
    if (multiplayerState?.inGame && multiplayerState?.gameData?.state === "end") {
      // save the final players
      setMultiplayerState((prev) => ({
        ...prev,
        gameData: {
          ...prev.gameData,
          finalPlayers: prev.gameData.players
        }
      }))
    }

      if (multiplayerState?.gameData?.state === "waiting") {
        // remove gameData.finalPlayers
        setMultiplayerState((prev) => ({ ...prev, gameData: { ...prev.gameData, finalPlayers: undefined } }));
      }
  }, [multiplayerState?.gameData?.state])


  useEffect(() => {
    if (!multiplayerState?.inGame && multiplayerState?.gameData?.public) {

      setMultiplayerChatEnabled(false)
      setMultiplayerChatOpen(false)
    }
    if (!ws) return;



    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if(data.type === "restartQueued") {
        setMaintenance(data.value ? true : false)
        if(data.value) {
          toast.info(text("maintenanceModeStarted"))
        } else if(!data.value && window.maintenance) {
          toast.info(text("maintenanceModeEnded"))
        }
        window.maintenance = data.value ? true : false;

      }
      if (data.type === "t") {
        const offset = data.t - Date.now();
        if (Math.abs(offset) > 1000 && ((Math.abs(offset) < Math.abs(timeOffset)) || !timeOffset)) {
          setTimeOffset(offset)
        }
      }

      if (data.type === "elo") {
        setEloData((prev) => ({
          ...prev,
          league: data.league,
          elo: data.elo,
        }))
      }

      if (data.type === "cnt") {
        setMultiplayerState((prev) => ({
          ...prev,
          playerCount: data.c
        }))
      } else if (data.type === "verify") {
        setMultiplayerState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          guestName: data.guestName
        }))
      } else if (data.type === "error") {
        setMultiplayerState((prev) => ({
          ...prev,
          connecting: false,
          connected: false,
          shouldConnect: false,
          error: data.message
        }))
        // disconnect
        if(data.message === "uac")
          {
            window.dontReconnect = true;
          }
          if(data.failedToLogin) {
            window.dontReconnect = true;
            // logout
            signOut()

          }
         ws.close();

        toast(data.message==='uac'?text('userAlreadyConnected'):data.message, { type: 'error' });

      } else if (data.type === "game") {
        setScreen("multiplayer")
        setMultiplayerState((prev) => {

          if(!data.public) {
            setMultiplayerChatEnabled(true)
          }

          try {
          if(data.state === "waiting" && inCrazyGames && data.host) {
            const link = window.CrazyGames.SDK.game.showInviteButton({ code: data.code });
          } else {
            window.CrazyGames.SDK.game.hideInviteButton();
          }
        } catch(e) {}

        setGameOptions((prev) => ({
          ...prev,
          nm: data.nm,
          npz: data.npz,
          showRoadName: data.showRoadName
        }))



          if (data.state === "getready") {
            setMultiplayerChatEnabled(true)

            // calculate extent on client
            // if(data.map !== "all" && !countries.map((c) => c?.toLowerCase()).includes(data.map?.toLowerCase())  && !gameOptions?.extent) {
            //   // calculate extent

            //   fetch(`/mapLocations/${data.map}`).then((res) => res.json()).then((data) => {
            //     if(data.ready) {

            //       const mappedLatLongs = data.locations.map((l) => fromLonLat([l.lng, l.lat], "EPSG:4326"));
            //       let extent = boundingExtent(mappedLatLongs);
            //       console.log("extent", extent)

            //       setGameOptions((prev) => ({
            //         ...prev,
            //         extent
            //       }))

            //     }
            //   })
            // }

          } else if (data.state === "guess") {
            const didIguess = (data.players ?? prev.gameData?.players)?.find((p) => p.id === prev.gameData?.myId)?.final;
            if (didIguess) {
              setMultiplayerChatEnabled(true)
            } else {
              if(multiplayerState?.gameData?.public) setMultiplayerChatEnabled(false)
            }
          }

          if ((!prev.gameData || (prev?.gameData?.state === "getready")) && data.state === "guess") {
            setPinPoint(null)
            if (!prev?.gameData?.locations && data.locations) {
              setLatLong(data.locations[data.curRound - 1])

            } else {
              setLatLong(prev?.gameData?.locations[data.curRound - 1])
            }
          }

          return {
            ...prev,
            gameQueued: false,
            inGame: true,
            gameData: {
              ...prev.gameData,
              ...data,
              type: undefined
            },
            enteringGameCode: false,
            joinOptions: initialMultiplayerState.joinOptions,
          }
        })

        if (data.state === "getready") {
          setStreetViewShown(false)
        } else if (data.state === "guess") {
          setStreetViewShown(true)
        }
      } else if(data.type === "duelEnd") {
        console.log("duel end", data)
        // { draw: boolean, newElo: number, oldElo: number, winner: boolean, timeElapsed: number }

        setMultiplayerState((prev) => ({
          ...prev,
          gameData: {
            ...prev.gameData,
            duelEnd: data
          }
        }));
      }else if(data.type === "publicDuelRange") {
        setMultiplayerState((prev) => ({
          ...prev,
            publicDuelRange: data.range
        }))
      }else if(data.type === "maxDist") {
        const maxDist = data.maxDist;
        console.log("got new max dist", maxDist)
        setMultiplayerState((prev) => ({
          ...prev,
          gameData: {
            ...prev.gameData,
            maxDist
          }
        }))

      } else if (data.type === "player") {
        if (data.action === "remove") {
          setMultiplayerState((prev) => ({
            ...prev,
            gameData: {
              ...prev.gameData,
              players: prev.gameData.players.filter((p) => p.id !== data.id)
            }
          }))
        } else if (data.action === "add") {
          setMultiplayerState((prev) => ({
            ...prev,
            gameData: {
              ...prev.gameData,
              players: [...prev.gameData.players, data.player]
            }
          }))
        }
      } else if (data.type === "place") {
        const id = data.id;
        if (id === multiplayerState.gameData.myId) {
          setMultiplayerChatEnabled(true)
        }

        const player = multiplayerState.gameData.players.find((p) => p.id === id);
        if (player) {
          player.final = data.final;
          player.latLong = data.latLong;
        }
      } else if (data.type === "gameOver") {
        setLatLong(null)
        setGameOptions((prev) => ({
          ...prev,
          extent: null
        }))

      } else if (data.type === "gameShutdown") {
        setScreen("home")
      setMultiplayerChatEnabled(false)

        setMultiplayerState((prev) => {
          return {
            ...initialMultiplayerState,
            connected: true,
            nextGameQueued: prev.nextGameQueued,
            playerCount: prev.playerCount,
            guestName: prev.guestName
          }
        });
        setGameOptions((prev) => ({
          ...prev,
          extent: null
        }))
      } else if (data.type === "gameJoinError" && multiplayerState.enteringGameCode) {
        setMultiplayerState((prev) => {
          return {
            ...prev,
            joinOptions: {
              ...prev.joinOptions,
              error: data.error,
              progress: false
            }
          }
        })
      } else if(data.type === 'generating') {
        // location generation before round
        setMultiplayerState((prev) => {
          return {
            ...prev,
            gameData: {
              ...prev.gameData,
              generated: data.generated
            }
          }
        })
      } else if(data.type === "friendReq") {
        const from = data.name;
        const id = data.id;
        const toAccept = (closeToast) => {
          ws.send(JSON.stringify({ type: 'acceptFriend', id }))
          closeToast()
        }
        const toDecline = (closeToast) => {
          ws.send(JSON.stringify({ type: 'declineFriend', id }))
          closeToast()
        }
        const toastComponent = function({closeToast}){
          return (
          <div>
            <span>{text("youGotFriendReq", { from })}</span>

            <button onClick={() => toAccept(closeToast)} className={"accept-button"}>✔</button>
            &nbsp;
            <button onClick={() => toDecline(closeToast)} className={"decline-button"}>✖</button>
          </div>
          )
        }

        toast(toastComponent, { type: 'info', theme: "dark" })


      } else if(data.type === 'toast') {
        toast(text(data.key, data), { type: data.toastType ?? 'info', theme: "dark", closeOnClick: data.closeOnClick ?? false, autoClose: data.autoClose ?? 5000 })
      } else if(data.type === 'invite') {
        // code, invitedByName, invitedById
        const { code, invitedByName, invitedById } = data;

        const toAccept = (closeToast) => {
          ws.send(JSON.stringify({ type: 'acceptInvite', code, invitedById }))
          closeToast()
        }
        const toDecline = (closeToast) => {
          closeToast()
        }
        const toastComponent = function({closeToast}){
          return (
          <div>
            <span>{text("youGotInvite", { from: invitedByName })}</span>

            <button onClick={() => toAccept(closeToast)} className={"accept-button"}>{text("join")}</button>
            &nbsp;
            <button onClick={() => toDecline(closeToast)} className={"decline-button"}>{text("decline")}</button>
          </div>
          )
        }

        toast(toastComponent, { type: 'info', theme: "dark", autoClose: 10000 })
      } else if(data.type === 'streak') {
        const streak = data.streak;

        if(streak === 0) {
          toast(text("streakLost"), { type: 'info', theme: "dark", autoClose: 5000, closeOnClick: true })
        } else if(streak === 1) {
          toast(text("streakStarted"), { type: 'info', theme: "dark", autoClose: 5000, closeOnClick: true })
        } else {
          toast(text("streakGained", { streak }), { type: 'info', theme: "dark", autoClose: 5000, closeOnClick: true })
        }
      }
    }

    // ws on disconnect
    ws.onclose = () => {
      setWs(null)
      console.log("ws closed")
      sendEvent("multiplayer_disconnect")

      setMultiplayerState((prev) => ({
        ...initialMultiplayerState,
      }));
      if(window.screen !== "home")
      setMultiplayerError(true)


    }

    ws.onerror = () => {
      setWs(null)
      console.log("ws error")
      sendEvent("multiplayer_disconnect")

      setMultiplayerState((prev) => ({
        ...initialMultiplayerState,
      }));
      if(window.screen !== "home")
      setMultiplayerError(true)
    }


    return () => {
      ws.onmessage = null;
    }
  }, [ws, multiplayerState, timeOffset, gameOptions?.extent]);

  useEffect(() => {
    window.screen = screen;
  }, [screen])

  useEffect(() => {
    if (multiplayerState?.connected && !multiplayerState?.inGame && multiplayerState?.nextGameQueued) {
      handleMultiplayerAction("publicDuel");
    }
  }, [multiplayerState, timeOffset])

  useEffect(() => {
    if (multiplayerState?.connected) {
      handleMultiplayerAction("screen", screen);
    }
  }, [screen]);


  // useEffect(() => {
  //   if (multiplayerState.inGame && multiplayerState.gameData?.state === "guess" && pinPoint) {
  //     // send guess
  //     console.log("pinpoint1", pinPoint)
  //     const pinpointLatLong = [pinPoint.lat, pinPoint.lng];
  //     ws.send(JSON.stringify({ type: "place", latLong: pinpointLatLong, final: false }))
  //   }
  // }, [multiplayerState, pinPoint])

  function guessMultiplayer(send) {
    if (!send) return;
    if (!multiplayerState.inGame || multiplayerState.gameData?.state !== "guess" || !pinPoint) return;
    const pinpointLatLong = [pinPoint.lat, pinPoint.lng];

    ws.send(JSON.stringify({ type: "place", latLong: pinpointLatLong, final: true }))
  }

  function sendInvite(id) {
    if(!ws || !multiplayerState?.connected) return;
    ws.send(JSON.stringify({ type: 'inviteFriend', friendId: id }))
  }

  useEffect(() => {
    try {
    const streak = gameStorage.getItem("countryStreak");
    if (streak) {
      setCountryStreak(parseInt(streak))
    }
    
    // preload/cache src.png and dest.png and src2.png
    const img = new Image();
    img.src = "./src.png";
    const img2 = new Image();
    img2.src = "./dest.png";
    const img3 = new Image();
    img3.src = "./src2.png";
  } catch(e) {}

  }, [])
  
  function init(){
    console.log("initialize");
    let onboardingLocations = [
      { namatempat : "Sulawesi Tenggara",lat: -3.97904249, long: 122.5447018, country: "AR", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/sultra_sinonggi.jpeg",
        gambar2:"http://localhost:3000/img/house/sultra_rumah_buton.jpg",
        gambar3:"http://localhost:3000/img/clothes/sultra_baju_tolaki.jpeg",
        makanan: "Sinonggi",
        rumah:"Rumah Buton",
        baju:"Baju Tolaki"
      },
      { namatempat : "Riau", lat: 0.794232098, long: 102.0484752, country: "ZA", otherOptions: ["CN", "PL"], 
        gambar1:"http://localhost:3000/img/food/riau_gulai_blacan.jpg",
        gambar2:"http://localhost:3000/img/house/riau_rumah_melayu_atap_limas.jpg",
        gambar3:"http://localhost:3000/img/clothes/riau_baju_cekak_musang.jpeg",
        makanan: "Gulai Blacan",
        rumah:"Rumah Melayu Atap Limas",
        baju:"Cekak Musang"
      },
      { namatempat : "Kepulauan Riau", lat: 0.98236648, long: 104.0409741, country: "EG", otherOptions: ["TR", "BR"] , 
        gambar1:"http://localhost:3000/img/food/kepri_lakse_kuah.jpeg",
        gambar2:"http://localhost:3000/img/house/kepri_rumah_belah_bubung.jpg",
        gambar3:"http://localhost:3000/img/clothes/kepri_baju_teluk_belanga.jpg",
        makanan: "Lakse Kuah",
        rumah:"Rumah Belah Bubung",
        baju:"Teluk Belanga"
      },
      { namatempat : "Kalimantan Selatan",lat: -3.315022831, long: 114.5924247, country: "AU", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/kalsel_soto_banjar.jpg",
        gambar2:"http://localhost:3000/img/house/kalsel_rumah_bubungan_tinggi.jpg",
        gambar3:"http://localhost:3000/img/clothes/kalsel_bagajah_gamuling_baular_lulut.jpg",
        makanan: "Soto Banjar",
        rumah:"Rumah Bubungan Tinggi",
        baju:"Bagajah Gamuling Baular Lulut"
      },
      { namatempat : "Jambi", lat: -1.630554161, long: 103.6076075, country: "FR", otherOptions: ["IT", "ES"] , 
        gambar1:"http://localhost:3000/img/food/jambi_gulai_ikan_patin.jpg",
        gambar2:"http://localhost:3000/img/house/jambi_rumah_kajang_leko.jpg",
        gambar3:"http://localhost:3000/img/clothes/jambi_baju_kurung.jpg",
        makanan: "Gulai Ikan Patin",
        rumah:"Rumah Kajang Leko",
        baju:"Baju Kurung"
      },
      { namatempat : "Sumatra Selatan", lat: -2.991718691, long: 104.7635279, country: "US", otherOptions: ["CA", "AU"] , 
        gambar1:"http://localhost:3000/img/food/sumsel_pempek.jpeg",
        gambar2:"http://localhost:3000/img/house/sumsel_rumah_limas.jpg",
        gambar3:"http://localhost:3000/img/clothes/sumsel_aesan_gede.jpg",
        makanan: "Pempek",
        rumah:"Rumah Limas",
        baju:"Aesan Gede"
      },
      { namatempat : "Nusa Tenggara Timur",lat: -8.569605068, long: 119.5015366, country: "AT", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/ntt_sei.jpg",
        gambar2:"http://localhost:3000/img/house/ntt_rumah_musalaki.jpeg",
        gambar3:"http://localhost:3000/img/clothes/ntt_amarasi.jpg",
        makanan: "Sei",
        rumah:"Rumah Musalaki",
        baju:"Amarasi"
      },
      { namatempat : "Bengkulu",lat: -3.787591786, long: 102.2511873, country: "ID", otherOptions: ["GB", "JP"] , 
        gambar1:"http://localhost:3000/img/food/bengkulu_pendap.jpg",
        gambar2:"http://localhost:3000/img/house/bengkulu_rumah_bubungan_lima.jpg",
        gambar3:"http://localhost:3000/img/clothes/bengkulu_baju_betabur.jpg",
        makanan: "Pendap",
        rumah:"Rumah Bubungan Lima",
        baju:"Betabur"
      },
      { namatempat : "Aceh", lat: 5.554333298, long: 95.31816559, country: "BE", otherOptions: ["GB", "JP"], 
        gambar1:"http://localhost:3000/img/food/aceh_kuah_pliek_u.jpg",
        gambar2:"http://localhost:3000/img/house/aceh_rumoh_aceh.jpg",
        gambar3:"http://localhost:3000/img/clothes/aceh_ulee_balang.jpg",
        makanan: "Kuah Pliek U",
        rumah:"Rumoh Aceh",
        baju:"Ulee Balang"
      },
      { namatempat : "Papua",lat: -2.591968459, long: 140.7142415, country: "BR", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/papua_sagu_lempeng.jpeg",
        gambar2:"http://localhost:3000/img/house/papua_honai.jpg",
        gambar3:"http://localhost:3000/img/clothes/papua_koteka.jpg",
        makanan: "Sagu Lempeng",
        rumah:"Honai",
        baju:"Koteka"
      },
      { namatempat : "Lampung",lat: -5.866666817, long: 105.7567569, country: "IN", otherOptions: ["ZA", "FR"] , 
        gambar1:"http://localhost:3000/img/food/lampung_seruit.jpg",
        gambar2:"http://localhost:3000/img/house/lampung_rumah_nuwo_sesat.jpg",
        gambar3:"http://localhost:3000/img/clothes/lampung_baju_sai_batin.jpeg",
        makanan: "Seruit",
        rumah:"Rumah Nuwo Sesat",
        baju:"Sai Batin"
      },
      { namatempat : "Nusa Tenggara Barat",lat: -8.900102292, long: 116.3098587, country: "BG", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/ntb_sate_bulayak.jpg",
        gambar2:"http://localhost:3000/img/house/ntb_bale_tani.jpg",
        gambar3:"http://localhost:3000/img/clothes/ntb_pegon.jpg",
        makanan: "Sate Bulayak",
        rumah:"Bale Tani",
        baju:"Pegon"
      },
      { namatempat : "Bali",lat: -8.620920051, long: 115.0871751, country: "CA", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/bali_ayam_betutu.jpeg",
        gambar2:"http://localhost:3000/img/house/bali_rumah_gapura.jpg",
        gambar3:"http://localhost:3000/img/clothes/bali_payas_agung.png",
        makanan: "Ayam Betutu",
        rumah:"Rumah Gapura",
        baju:"Payas Agung"
      },
      { namatempat : "Kalimantan Timur",lat: -0.502031957, long: 117.119406, country: "CL", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/kaltim_ayam_cincane.jpg",
        gambar2:"http://localhost:3000/img/house/kaltim_rumah_lamin.jpg",
        gambar3:"http://localhost:3000/img/clothes/kaltim_kustin.png",
        makanan: "Ayam Cincane",
        rumah:"Rumah Lamin",
        baju:"Kustin"
      },
      { namatempat : "Bangka Belitung",lat: -2.740100103, long: 107.6330474, country: "NO", otherOptions: ["US", "DE"] , 
        gambar1:"http://localhost:3000/img/food/babel_lempah_kuning.jpg",
        gambar2:"http://localhost:3000/img/house/babel_rumah_rakit.jpg",
        gambar3:"http://localhost:3000/img/clothes/babel_paksian.jpg",
        makanan: "Lempah Kuning",
        rumah:"Rumah Rakit",
        baju:"Paksian"
      },
      { namatempat : "Sulawesi Selatan",lat: -5.134162837, long: 119.4050917, country: "CO", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/sulsel_coto_makassar.jpg",
        gambar2:"http://localhost:3000/img/house/sulsel_tongkonan.jpg",
        gambar3:"http://localhost:3000/img/clothes/sulsel_baju_bodo.jpeg",
        makanan: "Coto Makassar",
        rumah:"Tongkonan",
        baju:"Baju Bodo"
      },
      { namatempat : "Sumatra Utara", lat: 2.739390044, long: 98.70800405, country: "CZ", otherOptions: ["ZA", "FR"], 
        gambar1:"http://localhost:3000/img/food/sumut_arsik.jpeg",
        gambar2:"http://localhost:3000/img/house/sumut_rumah_bolon.jpg",
        gambar3:"http://localhost:3000/img/clothes/sumut_baju_ulos.jpeg", 
        makanan: "Arsik",
        rumah:"Rumah Bolon",
        baju:"Ulos"
      },
      { namatempat : "DKI Jakarta",lat: -6.176009413, long: 106.8271575, country: "DK", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/jakarta_kerak_telor.jpg",
        gambar2:"http://localhost:3000/img/house/jakarta_rumah_kebaya.jpg",
        gambar3:"http://localhost:3000/img/clothes/jakarta_baju_sadariah.jpg",
        makanan: "Kerak Telor",
        rumah:"Rumah Kebaya",
        baju:"Sadariah"
      },
      { namatempat : "Gorontalo",lat: 0.548586798, long: 123.0086608, country: "FI", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/gorontalo_binte_biluhuta.jpeg",
        gambar2:"http://localhost:3000/img/house/gorontalo_duluhopa.jpg",
        gambar3:"http://localhost:3000/img/clothes/gorontalo_biliu_dan_makuta.jpg",
        makanan: "Binte Biluhuta",
        rumah:"Duluhopa",
        baju:"Biliu Dan Makuta"
      },
      { namatempat : "Sulawesi Tengah",lat: -0.882205922, long: 119.8416096, country: "HU", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/sulteng_kaledo.jpg",
        gambar2:"http://localhost:3000/img/house/sulteng_souraja.jpeg",
        gambar3:"http://localhost:3000/img/clothes/sulteng_nggembe.jpg",
        makanan: "Kaledo",
        rumah:"Souraja",
        baju:"Nggembe"
      },
      { namatempat : "Jawa Barat",lat: -6.901270066, long: 107.6187249, country: "IE", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/jabar_nasi_timbel.jpeg",
        gambar2:"http://localhost:3000/img/house/jabar_rumah_julang_ngapak.jpeg",
        gambar3:"http://localhost:3000/img/clothes/jabar_kebaya_sunda.jpeg",
        makanan: "Nasi Timbel",
        rumah:"Rumah Julang Ngapak",
        baju:"Kebaya Sunda"
      },
      { namatempat : "Banten",lat: -6.303708791, long: 106.6845625, country: "IT", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/banten_rabeg.jpg",
        gambar2:"http://localhost:3000/img/house/banten_rumah_baduy.jpg",
        gambar3:"http://localhost:3000/img/clothes/banten_pangsi.jpg",
        makanan: "Rabeg",
        rumah:"Rumah Baduy",
        baju:"Pangsi"
      },
      { namatempat : "Sulawesi Barat",lat: -2.671390464, long: 118.8894593, country: "JP", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/sulbar_jepa.jpeg",
        gambar2:"http://localhost:3000/img/house/sulbar_boyang.jpeg",
        gambar3:"http://localhost:3000/img/clothes/sulbar_pattuqduq_towaine.jpg",
        makanan: "Jepa",
        rumah:"Boyang",
        baju:"Pattuqduq Towaine"
      },
      { namatempat : "Jawa Tengah",lat: -7.607987695, long: 110.2048795, country: "KE", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/jateng_brekecek.jpg",
        gambar2:"http://localhost:3000/img/house/jateng_joglo.jpg",
        gambar3:"http://localhost:3000/img/clothes/jateng_jawi_jangkep.jpeg",
        makanan: "Brekecek",
        rumah:"Joglo",
        baju:"Jawi Jangkep"
      },
      { namatempat : "Maluku",lat: -3.692966842, long: 128.1839293, country: "MY", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/maluku_papeda.jpeg",
        gambar2:"http://localhost:3000/img/house/maluku_baileo.jpg",
        gambar3:"http://localhost:3000/img/clothes/maluku_baju_cele.jpg",
        makanan: "Papeda",
        rumah:"Baileo",
        baju:"Baju Cele"
      },
      { namatempat : "DI Yogyakarta",lat: -7.782884935, long: 110.3669844, country: "MX", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/yogya_gudeg.jpg",
        gambar2:"http://localhost:3000/img/house/yogya_bangsal_kencono.jpg",
        gambar3:"http://localhost:3000/img/clothes/yogya_surjan.jpg",
        makanan: "Gudeg",
        rumah:"Bangsal Kencono",
        baju:"Surjan"
      },
      { namatempat : "Maluku Utara",lat: 0.766603988, long: 127.3771247, country: "RO", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/malut_gohu_ikan.jpg",
        gambar2:"http://localhost:3000/img/house/malut_sasadu.jpg",
        gambar3:"http://localhost:3000/img/clothes/malut_manteren_lamo.jpg",
        makanan: "Gohu Ikan",
        rumah:"Sasadu",
        baju:"Manteren Lamo"
      },
      { namatempat : "Jawa Timur",lat: -7.295837465, long: 112.7386751, country: "NL", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/jatim_rawon.jpg",
        gambar2:"http://localhost:3000/img/house/jatim_rumah_joglo.jpg",
        gambar3:"http://localhost:3000/img/clothes/jatim_pesa'an.jpg",
        makanan: "Rawon",
        rumah:"Rumah Joglo",
        baju:"Pesa'An"
      },
      { namatempat : "Kalimantan Barat",lat: 0.001219357, long: 109.3223619, country: "NZ", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/kalbar_pengkang.jpg",
        gambar2:"http://localhost:3000/img/house/kalbar_rumah_panjang.jpg",
        gambar3:"http://localhost:3000/img/clothes/kalbar_king_baba.jpg",
        makanan: "Pengkang",
        rumah:"Rumah Panjang",
        baju:"King Baba"
      },
      { namatempat : "Kalimantan Tengah",lat: -2.676314047, long: 111.631911, country: "NG", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/kalteng_juhu_singkah.jpg",
        gambar2:"http://localhost:3000/img/house/kalteng_rumah_betang.jpg",
        gambar3:"http://localhost:3000/img/clothes/kalteng_upak_nyamu.jpg",
        makanan: "Juhu Singkah",
        rumah:"Rumah Betang",
        baju:"Upak Nyamu"
      },
      { namatempat : "Sumatra Barat", lat: -0.305197953, long: 100.369436, country: "PH", otherOptions: ["US", "DE"], 
        gambar1:"http://localhost:3000/img/food/sumbar_rendang.jpg",
        gambar2:"http://localhost:3000/img/house/sumbar_rumah_gadang.jpg",
        gambar3:"http://localhost:3000/img/clothes/sumbar_baju_bundo_kanduang.jpg",
        makanan: "Rendang",
        rumah:"Rumah Gadang",
        baju:"Bundo Kanduang"
      },
      { namatempat : "Kalimantan Utara",lat: 2.855931029, long: 117.363579, country: "PT", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/kalut_kepiting_soka.jpg",
        gambar2:"http://localhost:3000/img/house/kalut_rumah_baloy.jpeg",
        gambar3:"http://localhost:3000/img/clothes/kalut_ta'a_dan_sapei_sapaq.jpg",
        makanan: "Kepiting Soka",
        rumah:"Rumah Baloy",
        baju:"Ta'a dan Sapei Sapaq"
      },
      { namatempat : "Sulawesi Utara",lat: 1.6201395793, long: 124.7646179, country: "PL", otherOptions: ["CN", "PL"] , 
        gambar1:"http://localhost:3000/img/food/sulut_tinutuan.jpg",
        gambar2:"http://localhost:3000/img/house/sulut_rumah_walewangko.jpeg",
        gambar3:"http://localhost:3000/img/clothes/sulut_laku_tepu.jpg",
        makanan: "Tinutuan",
        rumah:"Rumah Walewangko",
        baju:"Laku Tepu"
      },
    ]
    // pick 10 random locations no repeats
    const gambaranbanyak = [];
    tempat = [];
    // console.log(tempat);
    while (tempat.length < 10) {
      const loc = onboardingLocations[Math.floor(Math.random() * onboardingLocations.length)]
      if (!tempat.find((l) => l.country === loc.country)) {
        tempat.push(loc)
      }
    }
    fetchMethod();
    console.log(tempat);

  }
  // init();
  function reloadBtnPressed() {
    init();
    if(window.reloadLoc) {
      window.reloadLoc()
    }
  }

  function crazyMidgame(adFinished = () => {}) {
    if(window.inCrazyGames && window.CrazyGames.SDK.environment !== "disabled") {
      try {
    const callbacks = {
      adFinished: () => adFinished(),
      adError: (error) => adFinished(),
      adStarted: () => console.log("Start midgame ad"),
    };
    window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
  } catch(e) {}
  } else {
    adFinished()
  }
  }


  useEffect(() => {
  window.crazyMidgame = crazyMidgame;

  }, []);
  function backBtnPressed(queueNextGame = false) {



    if (loading) setLoading(false);
    if(multiplayerError) setMultiplayerError(false)

      setPartyModalShown(false)

    if(window.learnMode) {
      // redirect to home
      window.location.href = "/"
      return;
    }

    if(screen === "onboarding") {
      setScreen("home")
      setOnboarding(null)
      setOnboardingCompleted(true)
        gameStorage.setItem("onboarding", 'done')

      return;
    }

    setStreetViewShown(false)

    if (multiplayerState?.inGame) {
      if(!multiplayerState?.gameData?.host || multiplayerState?.gameData?.state === "waiting") {
      ws.send(JSON.stringify({
        type: 'leaveGame'
      }))

      if(inCrazyGames) {
        try {
          window.CrazyGames.SDK.game.hideInviteButton();
        } catch(e) {}
      }

      setMultiplayerState((prev) => {
        return {
          ...prev,
          nextGameQueued: queueNextGame === true
        }
      })
      setScreen("home")
      setMultiplayerChatEnabled(false)

      if(["getready", "guess"].includes(multiplayerState?.gameData?.state)) {
        crazyMidgame()
      }
    } else {
      ws.send(JSON.stringify({ type: "resetGame" }))
    }
    } else if ((multiplayerState?.enteringGameCode) && multiplayerState?.connected) {

      setMultiplayerState((prev) => {
        return {
          ...initialMultiplayerState,
          connected: true,
          playerCount: prev.playerCount,
          guestName: prev.guestName

        }
      })
      setScreen("home")

    } else if(multiplayerState?.gameQueued) {
      console.log("gameQueued")
      ws.send(JSON.stringify({ type: "leaveQueue" }))

      setMultiplayerState((prev) => {
        return {
          ...prev,
          gameQueued: false
        }
      });
      setScreen("home")

    } else {
      setMultiplayerChatEnabled(false)

      setScreen("home");
      setGameOptions((prev) => ({
        ...prev,
        extent: null
      }))
      clearLocation();
    }
  }

  function clearLocation() {
    setLatLong({ lat: 0, long: 0 })
    setStreetViewShown(false)
    setShowAnswer(false)
    setPinPoint(null)
    setHintShown(false)
  }

  function fetchMethod() {
    //gameOptions.countryMap && gameOptions.offical
    console.log("fetching")
    // fetch(window.cConfig.apiUrl+((gameOptions.location==="all")?`/${window?.learnMode ? 'clue': 'all'}Countries.json`:
    // gameOptions.countryMap && gameOptions.official ? `/countryLocations/${gameOptions.countryMap}` :
    // `/mapLocations/${gameOptions.location}`)).then((res) => res.json()).then((data) => {
      let ayam = true;
      if(ayam) {
        // this uses long for lng
        // for(let i = 0; i < data.locations.length; i++) {
        //   if(data.locations[i].lng && !data.locations[i].long) {
        //     data.locations[i].long = data.locations[i].lng;
        //     delete data.locations[i].lng;
        //   }
        // }
        
        // console.log(data.locations);

        // setAllLocsArray(data.locations)
        
        setAllLocsArray(tempat);

        if(gameOptions.location === "all") {
        const loc = tempat[0]
        setLatLong(loc)

        } else {
          let loc = tempat[Math.floor(Math.random() * tempat.length)];

          while(loc.lat === latLong.lat && loc.long === latLong.long) {
            loc = tempat[Math.floor(Math.random() * tempat.length)];
          }

          setLatLong(loc)
          if(data.name) {

            // calculate extent (for openlayers)
             const mappedLatLongs = tempat.map((l) => fromLonLat([l.long, l.lat], 'EPSG:4326'));
             let extent = boundingExtent(mappedLatLongs);
             console.log("extent", extent)
             // convert extent from EPSG:4326 to EPSG:3857 (for openlayers)

            setGameOptions((prev) => ({
              ...prev,
              communityMapName: data.name,
              official: data.official ?? false,
              maxDist: data.maxDist ?? 20000,
              extent: extent
            }))

          }
        }

      } else {
        if(gameOptions.location !== "all") {
      toast(text("errorLoadingMap"), { type: 'error' })
        }
        defaultMethod()
      }
    // }).catch((e) => {
    //   console.error(e)
    //   toast(text("errorLoadingMap"), { type: 'error' })
    //   defaultMethod()
    // });
  }
  function mulailagi()
  {
    reloadBtnPressed() ;
  }
  function loadLocation() {
    if (loading) return;
    console.log("loading location")
    setLoading(true)
    setShowAnswer(false)
    setPinPoint(null)
    setLatLong(null)    
    setHintShown(false)
    console.log(screen);
    if(screen === "onboarding") {
      setLatLong(onboarding.locations[onboarding.round - 1]);
      // console.log(onboarding.locations[onboarding.round - 1]);
      let options = JSON.parse(JSON.stringify(onboarding.locations[onboarding.round - 1].otherOptions));
      options.push(onboarding.locations[onboarding.round - 1].country)
      // shuffle
      options = options.sort(() => Math.random() - 0.5)
      setOtherOptions(options)
    } else {    
  
  fetchMethod();
  // console.log(tempat);
  // console.log(allLocsArray)
  // console.log(gameOptions.location) 
    if(allLocsArray.length===0) {
      fetchMethod()
    } else if(allLocsArray.length>0) {
      const locIndex = allLocsArray.findIndex((l) => l.lat === latLong.lat && l.long === latLong.long);
      if((locIndex === -1) || allLocsArray.length === 1) {
        console.log("could not find location in array", locIndex, allLocsArray)
       fetchMethod()
      } else {
        if(gameOptions.location === "all") {
        const loc = allLocsArray[locIndex+1] ?? allLocsArray[0];
        setLatLong(loc)
        } else {
          // prevent repeats: remove the prev location from the array
          setAllLocsArray((prev) => {
             const newArr = prev.filter((l) => l.lat !== latLong.lat && l.long !== latLong.long)


             // community maps are randomized
             const loc = newArr[Math.floor(Math.random() * newArr.length)];


             setLatLong(loc)
             return newArr;
            })

        }
      }

  }
    }
    
    // if(singlePlayerRound.round)
      // {console.log(singlePlayerRound);}
   
  }
  function onNavbarLogoPress() {
    if(screen === "onboarding") return;

    if (screen !== "home" && !loading) {
      if (screen==="multiplayer" && multiplayerState?.connected && !multiplayerState?.inGame) {
        return;
      }
      if (!multiplayerState?.inGame) loadLocation()
      else if (multiplayerState?.gameData?.state === "guess") {

      }
    }
  }

  const ChatboxMemo = React.useMemo(() => <ChatBox miniMapShown={miniMapShown} ws={ws} open={multiplayerChatOpen} onToggle={() => setMultiplayerChatOpen(!multiplayerChatOpen)} enabled={
    session?.token?.secret && multiplayerChatEnabled
  }
  isGuest={session?.token?.secret ? false : true}
  publicGame={multiplayerState?.gameData?.public}
  myId={multiplayerState?.gameData?.myId} inGame={multiplayerState?.inGame} />, [multiplayerChatOpen, multiplayerChatEnabled, ws, multiplayerState?.gameData?.myId, multiplayerState?.inGame, multiplayerState?.gameData?.public, miniMapShown, session?.token?.secret])

  // Send pong every 10 seconds if websocket is connected
  useEffect(() => {
    const pongInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    }, 10000); // Send pong every 10 seconds

    return () => clearInterval(pongInterval);
  }, [ws]);
  const panoramaRef = useRef(null);
  const [showPanoOnResult, setShowPanoOnResult] = useState(false);

  useEffect(() => {
    let intt=null;
    // const map =  new google.maps.Map(document.getElementById("map"), {
    //   center: fenway,
    //   zoom: 14,
    // });
    if(legacyMapLoader) {
      if  (panoramaRef.current) {
        // destroy the old panorama
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
      return;
    }
    if(!latLong || (latLong.lat === 0 && latLong.long === 0)) return console.log("latLong not found");
    if(!document.getElementById("googlemaps")) return console.log("googlemaps not found");

    if(!panoramaRef.current) {



      console.log("panorama not found");
    panoramaRef.current = new google.maps.StreetViewPanorama(
      document.getElementById("googlemaps"),
      {
        position: { lat: latLong.lat, lng: latLong.long },
        pov: {
          heading: 0,
          pitch: 0,
        },
        motionTracking: false,
        linksControl: (gameOptions?.nm&&!showAnswer) ? false:true,
        clickToGo: (gameOptions?.nm&&!showAnswer) ? false:true,

        panControl: (gameOptions?.npz&&!showAnswer) ? false:true,
        zoomControl: (gameOptions?.npz&&!showAnswer) ? false:true,
        showRoadLabels: gameOptions?.showRoadName===true?true:false,
        disableDefaultUI: true,
      },
    );

    window.reloadLoc = () => {
      panoramaRef.current.setPosition({ lat: latLong.lat, lng: latLong.long });
    }
    window.panorama = panoramaRef.current;
  } else {

    panoramaRef.current.setPosition({ lat: latLong.lat, lng: latLong.long });
let setTime = Date.now();
    function snapBack() {
      const panoramaPos = panoramaRef.current.getPosition();
      const distance = haversineDistance(panoramaPos.lat(), panoramaPos.lng(), latLong.lat, latLong.long);
      console.log("distance", distance)
      if(distance > 10) {
        panoramaRef.current.setPosition({ lat: latLong.lat, lng: latLong.long });
      }
    }
    intt=setInterval(() => {
      if(Date.now() - setTime > 3000) {
        console.log("clearing interval")
        return clearInterval(intt);
      }
      // if too far from latLong, reset to latLong
      snapBack();
    }, 200)



    window.reloadLoc = () => {
      panoramaRef.current.setPosition({ lat: latLong.lat, lng: latLong.long });
    }

    // make sure linksControl,clickToGo,panControl,zoomControl are correct
    panoramaRef.current.setOptions({
      linksControl: (gameOptions?.nm&&!showAnswer) ? false:true,
      clickToGo: (gameOptions?.nm&&!showAnswer) ? false:true,
      panControl: (gameOptions?.npz&&!showAnswer) ? false:true,
      zoomControl: (gameOptions?.npz&&!showAnswer) ? false:true,
      showRoadLabels: gameOptions?.showRoadName===true?true:false,
    });

  }


    // pano onload

    function fixPitch() {
      // point towards road

      panoramaRef.current.setPov(panoramaRef.current.getPhotographerPov());
      panoramaRef.current.setZoom(0);

      // if localhost log the location
      if(window.location.hostname === "localhost") {
        console.log("[DEV] country:", latLong.country);
      }
    }


    let loaded = false;
    function onChangeListener(e) {
      if(loaded) return;
      loaded = true;

        setTimeout(() => {
        setLoading(false)
        setStreetViewShown(true)
            // Select all <meta> tags with the attribute http-equiv="origin-trial"
    const metaTags = document.querySelectorAll('meta[http-equiv="origin-trial"]');

    // Loop through the NodeList and remove each tag
    metaTags.forEach(meta => meta.remove());
        }, 500)
        fixBranding();

        fixPitch();
    }
    panoramaRef.current.addListener("pano_changed", onChangeListener);


    return () => {
      if(intt) clearInterval(intt);
      if(!panoramaRef.current) return;
      google.maps.event.clearListeners(panoramaRef.current, 'pano_changed');
    }


  }, [latLong, gameOptions?.nm, gameOptions?.npz, gameOptions?.showRoadName, legacyMapLoader, showAnswer])


  useEffect(() => {
    function checkForCheats() {
      if(document.getElementById("coordinates")) return true;
      // try {
      // if(window.localStorage.getItem("banned")) return true;
      // } catch(e) {
      // }
      return false;
    }
    function banGame() {
      if(window.banned) return;
      sendEvent("cheat_detected")
      window.banned = true;
      document.write("<h1>You have been banned from playing this game.</h1> If you believe this is a mistake, please contact us at	support@worldguessr.com")
      window.localStorage.setItem("banned", "true")
    }
    if(checkForCheats()) {
      banGame();
    }
    const i = setInterval(() => {
      if(checkForCheats()) {
        banGame();
      }
    }, 10000);
    return () => clearInterval(i);
  }, [])
//   useEffect(() => {
// //!(latLong && multiplayerState?.gameData?.state !== 'end')) || (!streetViewShown || loading || (showAnswer && !showPanoOnResult) ||  (multiplayerState?.gameData?.state === 'getready') || !latLong)
//     // debug this condition:
//     console.log("isHidden", !(latLong && multiplayerState?.gameData?.state !== 'end')) || (!streetViewShown || loading || (showAnswer && !showPanoOnResult) ||  (multiplayerState?.gameData?.state === 'getready') || !latLong)

//     console.log("latLong", latLong)
//     console.log("multiplayerState?.gameData?.state", multiplayerState?.gameData?.state)
//     console.log("streetViewShown", streetViewShown)
//     console.log("loading", loading)
//     console.log("showAnswer", showAnswer)
//     console.log("showPanoOnResult", showPanoOnResult)


//   }, [latLong, multiplayerState?.gameData?.state, streetViewShown, loading, showAnswer, showPanoOnResult])

  useEffect(() => {

    if(panoramaRef.current) {
      panoramaRef.current.setOptions({
        linksControl: gameOptions?.nm ? false:true,
        clickToGo: gameOptions?.nm ? false:true,

        panControl: true,

        zoomControl: gameOptions?.npz ? false:true,
        showRoadLabels: gameOptions?.showRoadName===true?true:false,
      })
    }
  }, [gameOptions?.nm, gameOptions?.npz, gameOptions?.showRoadName])


  return (
    <>
      <HeadContent text={text}/>
      <AccountModal inCrazyGames={inCrazyGames} shown={accountModalOpen} session={session} setAccountModalOpen={setAccountModalOpen} />
      <SetUsernameModal shown={session && session?.token?.secret && !session.token.username} session={session} />
      <SuggestAccountModal shown={showSuggestLoginModal} setOpen={setShowSuggestLoginModal} />
      <DiscordModal shown={showDiscordModal} setOpen={setShowDiscordModal} />
      {/* <MerchModal shown={merchModal} onClose={() => setMerchModal(false)} session={session} /> */}
      <LeagueModal shown={leagueModal} onClose={() => setLeagueModal(false)} session={session} eloData={eloData} />
      {ChatboxMemo}
    <ToastContainer/>

    <div className="videoAdParent hidden">
  <div className="videoAdPlayer">
    <div className="messageContainer">
      <p className="thankYouMessage">{text("videoAdThanks")}<br/>{text("enjoyGameplay")}</p>
    </div>
    <div id="videoad"></div>
  </div>
</div>

{screen === "home" && !mapModal && !merchModal && !friendsModal && !accountModalOpen && !leagueModal && (
       <div className="home__footer">
          <div className="footer_btns">
        { !isApp && (
                  <>
                <Link href={"/leaderboard"+(inCrazyGames ? "?crazygames": "")}>

                <button className="home__squarebtn gameBtn" aria-label="Leaderboard"><FaRankingStar className="home__squarebtnicon" /></button></Link>
                </>
                )}

                <button className="home__squarebtn gameBtn" aria-label="Settings" onClick={() => setSettingsModal(true)}><FaGear className="home__squarebtnicon" /></button>
                </div>
        </div>
        )} 

<div style={{
        top: 0,
        left: 0,
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        transition: 'opacity 0.5s',
        opacity: 0.4,
        userSelect: 'none',
       WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: 'none',
      }}>
      <NextImage.default src={'./home_wp.jpg'}
      draggable={false}
      fill   alt="Game Background" style={{objectFit: "cover",userSelect:'none'}}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      </div>


      <main className={`home`} id="main">
        { latLong && latLong?.lat && latLong?.long && legacyMapLoader ? (
<>
    <iframe className={`streetview ${(loading ||  (!((screen === "onboarding"&&!onboarding?.completed) || (screen === "singleplayer" && !singlePlayerRound?.done) || ["getready", "guess"].includes(multiplayerState?.gameData?.state)))) ? 'hidden' : ''} ${false ? 'multiplayer' : ''} ${gameOptions?.nmpz&&!showAnswer ? 'nmpz' : ''}`} src={`https://www.google.com/maps/embed/v1/streetview?location=${latLong.lat},${latLong.long}&key=AIzaSyA2fHNuyc768n9ZJLTrfbkWLNK3sLOK-iQ&fov=90&language=iw`} id="streetview" referrerPolicy='no-referrer-when-downgrade' allow='accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture' onLoad={() => {

setTimeout(() => {
  setLoading(false)

  window.reloadLoc = () => {
    const iframe = document.getElementById('streetview');
    if (iframe) {
        iframe.src = iframe.src; // Reload the iframe by resetting its src attribute
    }
    //
  }

}, 500)
       }}
       style={{
        width: '100vw',
        height: 'calc(100vh + 300px)',
        zIndex: 100,
        transform: 'translateY(-285px)',
        }}
        ></iframe>


{/* put something in the top left to cover the address */}
{/* <div style={{
  position: 'fixed',
  top: '7px',
  right: 0,
  width: '200px',
  height: '62px',
  backgroundColor: 'rgba(0,0,0,0)',
  // blur the address
  backdropFilter: 'blur(10px)',
  zIndex: 100
}}></div>
<div style={{
  position: 'fixed',
  bottom: '7px',
  left: 0,
  width: '200px',
  height: '10px',
  backgroundColor: 'rgba(0,0,0,0)',
  // blur the address
  backdropFilter: 'blur(10px)',
  zIndex: 100
}}></div> */}

       </>

      ) : (
       <div id="googlemaps" className={`streetview inverted ${(loading ||  (!((screen === "onboarding"&&!onboarding?.completed) || (screen === "singleplayer" && !singlePlayerRound?.done) || ["getready", "guess"].includes(multiplayerState?.gameData?.state)))) ? 'hidden' : ''} ${((!(latLong && multiplayerState?.gameData?.state !== 'end')) || (!streetViewShown || loading || (showAnswer && !showPanoOnResult) ||  (multiplayerState?.gameData?.state === 'getready') || !latLong)) ? 'hidden' : ''} ${false ? 'multiplayer' : ''} ${(gameOptions?.npz&&!showAnswer) ? 'nmpz' : ''}`}></div>
      )}
        <BannerText text={`${text("loading")}...`} shown={loading} showCompass={true} />



      <Navbar maintenance={maintenance} inCrazyGames={inCrazyGames} loading={loading} onFriendsPress={()=>setFriendsModal(true)} loginQueued={loginQueued} setLoginQueued={setLoginQueued} inGame={multiplayerState?.inGame || screen === "singleplayer"} openAccountModal={() => setAccountModalOpen(true)} session={session} reloadBtnPressed={reloadBtnPressed} backBtnPressed={backBtnPressed} setGameOptionsModalShown={setGameOptionsModalShown} onNavbarPress={() => onNavbarLogoPress()} gameOptions={gameOptions} screen={screen} multiplayerState={multiplayerState} shown={!multiplayerState?.gameData?.public && !leagueModal} />
{/* ELO/League button */}
{screen === "home" && !mapModal && session && session?.token?.secret && (
  <button className="gameBtn leagueBtn" onClick={()=>{setLeagueModal(true)}} style={{backgroundColor: eloData?.league?.color }}>
    { !eloData ? '...' : animatedEloDisplay } ELO {eloData?.league?.emoji}
  </button>
)}


        <div className={`home__content ${screen !== "home" ? "hidden" : ""} `}>


        { onboardingCompleted===null ? (
          <>

          </>
        ) : (
          <>

          <div className="home__ui">
            
            <div className="home__btns">

              { (

              <>
       <div className="home__ui">
       <h1 className="home__title">Geonesia</h1>
       </div>
      <div className={`mainHomeBtns `}>
              <button className="homeBtn singleplayer"
              
                onClick={() => {
                if (!loading) {
                  init();
                  crazyMidgame(() => setScreen("singleplayer"))
                }
              }} >
                {text("singleplayer")}</button>
        {/* <span className="bigSpan">{text("playOnline")}</span> */}


        {/* <button className="homeBtn multiplayerOptionBtn publicGame" onClick={() => handleMultiplayerAction("publicDuel")}
          disabled={!multiplayerState.connected || maintenance}>{session?.token?.secret ? text("rankedDuel") : text("findDuel")}</button> */}

        {/* <span className="bigSpan" disabled={!multiplayerState.connected}>{text("playFriends")}</span> */}
        {/* <div className="multiplayerPrivBtns">
        <button className="homeBtn multiplayerOptionBtn" disabled={!multiplayerState.connected || maintenance} onClick={() => handleMultiplayerAction("createPrivateGame")}>{text("createGame")}</button>
        <button className="homeBtn multiplayerOptionBtn" disabled={!multiplayerState.connected || maintenance} onClick={() => handleMultiplayerAction("joinPrivateGame")}>{text("joinGame")}</button>
        </div> */}
      </div>

              {/* <div className="home__squarebtns"> */}
{/*                 { !isApp && (
                  <>
                <Link target="_blank" href={"https://github.com/codergautam/worldguessr"}><button className="home__squarebtn gameBtn" aria-label="Github"><FaGithub className="home__squarebtnicon" /></button></Link>
                <Link target="_blank" href={"https://discord.gg/ubdJHjKtrC"}><button className="home__squarebtn gameBtn" aria-label="Discord"><FaDiscord className="home__squarebtnicon" /></button></Link>
                <Link href={"./leaderboard"}><button className="home__squarebtn gameBtn" aria-label="Leaderboard"><FaRankingStar className="home__squarebtnicon" /></button></Link>
                </>
                )}
                <button className="home__squarebtn gameBtn" aria-label="Settings" onClick={() => setSettingsModal(true)}><FaGear className="home__squarebtnicon" /></button>
 */}
                {/* <button className="homeBtn" aria-label="Community Maps" onClick={()=>setMapModal(true)}>{text("communityMaps")}</button> */}
                {/* </div> */}

              </>
            )}
            </div>

          {/* <div style={{ marginTop: "20px" }}>
            <center>
              { !loading && screen === "home"  && !inCrazyGames &&(!session?.token?.supporter) && (
    <Ad inCrazyGames={inCrazyGames} screenH={height} types={[[320,50],[728,90],[970,90],[970,250]]} screenW={width} />
              )}
    </center>
            </div> */}
          </div>
          </>
        )}
          <br />


        </div>

        <InfoModal shown={false} />
        <MapsModal inLegacy={legacyMapLoader} shown={mapModal || gameOptionsModalShown} session={session} onClose={() => {setMapModal(false);setGameOptionsModalShown(false)}} text={text}
            customChooseMapCallback={(gameOptionsModalShown&&screen==="singleplayer")?(map)=> {
              console.log("map disini", map)
              openMap(map.countryMap||map.slug);
              setGameOptionsModalShown(false)
            }:null}
            showAllCountriesOption={(gameOptionsModalShown&&screen==="singleplayer")}
            showOptions={screen==="singleplayer"}
            gameOptions={gameOptions} setGameOptions={setGameOptions} />

        <SettingsModal inCrazyGames={inCrazyGames} options={options} setOptions={setOptions} shown={settingsModal} onClose={() => setSettingsModal(false)} />

        <FriendsModal ws={ws} shown={friendsModal} onClose={() => setFriendsModal(false)} session={session} canSendInvite={
          // send invite if in a private multiplayer game, dont need to be host or in game waiting just need to be in a Party
          multiplayerState?.inGame && !multiplayerState?.gameData?.public
        } sendInvite={sendInvite} />

        {screen === "singleplayer" && <div className="home__singleplayer">
          <GameUI
          hintgambar={hintgambar}
          miniMapShown={miniMapShown} setMiniMapShown={setMiniMapShown}
            singlePlayerRound={singlePlayerRound} mulailagi={mulailagi} setSinglePlayerRound={setSinglePlayerRound} showDiscordModal={showDiscordModal}  setShowDiscordModal={setShowDiscordModal} inCrazyGames={inCrazyGames} showPanoOnResult={showPanoOnResult} setShowPanoOnResult={setShowPanoOnResult} options={options} countryStreak={countryStreak} setCountryStreak={setCountryStreak} xpEarned={xpEarned} setXpEarned={setXpEarned} hintShown={hintShown} setHintShown={setHintShown} pinPoint={pinPoint} setPinPoint={setPinPoint} showAnswer={showAnswer} setShowAnswer={setShowAnswer} loading={loading} setLoading={setLoading} session={session} gameOptionsModalShown={gameOptionsModalShown} setGameOptionsModalShown={setGameOptionsModalShown} latLong={latLong} streetViewShown={streetViewShown} setStreetViewShown={setStreetViewShown} loadLocation={loadLocation} gameOptions={gameOptions} setGameOptions={setGameOptions} />
        </div>}
        {screen === "onboarding" && onboarding?.round && <div className="home__onboarding">
          <GameUI
          hintgambar={hintgambar}
          miniMapShown={miniMapShown} setMiniMapShown={setMiniMapShown}
            inCrazyGames={inCrazyGames} showPanoOnResult={showPanoOnResult} setShowPanoOnResult={setShowPanoOnResult} countryGuesserCorrect={countryGuesserCorrect} setCountryGuesserCorrect={setCountryGuesserCorrect} showCountryButtons={showCountryButtons} setShowCountryButtons={setShowCountryButtons} otherOptions={otherOptions} onboarding={onboarding} countryGuesser={false} setOnboarding={setOnboarding} options={options} countryStreak={countryStreak} setCountryStreak={setCountryStreak} xpEarned={xpEarned} setXpEarned={setXpEarned} hintShown={hintShown} setHintShown={setHintShown} pinPoint={pinPoint} setPinPoint={setPinPoint} showAnswer={showAnswer} setShowAnswer={setShowAnswer} loading={loading} setLoading={setLoading} session={session} gameOptionsModalShown={gameOptionsModalShown} setGameOptionsModalShown={setGameOptionsModalShown} latLong={latLong} streetViewShown={streetViewShown} setStreetViewShown={setStreetViewShown} loadLocation={loadLocation} gameOptions={gameOptions} setGameOptions={setGameOptions} />
          </div>}

          {screen === "onboarding" && onboarding?.completed && <div className="home__onboarding">
            <div className="home__onboarding__completed">
              <OnboardingText words={[
                text("onboarding1")
              ]} pageDone={() => {
                try {
                  gameStorage.setItem("onboarding", 'done')
                } catch(e) {}
                setOnboarding((prev)=>{
                  return {
                    ...prev,
                    finalOnboardingShown: true
                  }
                })
              }} shown={!onboarding?.finalOnboardingShown} />
              <RoundOverScreen button1Text={text("home")} onboarding={onboarding} setOnboarding={setOnboarding} points={onboarding.points} time={msToTime(onboarding.timeTaken)} maxPoints={25000} button1Press={() =>{
                if(onboarding) {
                  sendEvent("tutorial_end");
                  try {
                  gameStorage.setItem("onboarding", 'done')
                  } catch(e) {}
                }

                setOnboarding(null)
                if(!window.location.search.includes("app=true") && !inCrazyGames) {
      setShowSuggestLoginModal(true)
    }
                setScreen("home")
              }}/>
              </div>
              </div>
}


  <RoundOverScreen hidden={!(multiplayerState?.inGame && multiplayerState?.gameData?.state === 'end' && multiplayerState?.gameData?.duelEnd)} duel={true} data={multiplayerState?.gameData?.duelEnd} button1Text={text("playAgain")}

  button1Press={() => {
    backBtnPressed(true)

  }}

  button2Text={text("home")}
  button2Press={() => {

    backBtnPressed()


  }}
  />


        {screen === "multiplayer" && <div className="home__multiplayer">
          <MultiplayerHome partyModalShown={partyModalShown} setPartyModalShown={setPartyModalShown} multiplayerError={multiplayerError} handleAction={handleMultiplayerAction} session={session} ws={ws} setWs={setWs} multiplayerState={multiplayerState} setMultiplayerState={setMultiplayerState} />
        </div>}

        {multiplayerState.inGame && ["guess", "getready", "end"].includes(multiplayerState.gameData?.state) && (
          <GameUI
          hintgambar={hintgambar}
          miniMapShown={miniMapShown} setMiniMapShown={setMiniMapShown}
          inCrazyGames={inCrazyGames} showPanoOnResult={showPanoOnResult} setShowPanoOnResult={setShowPanoOnResult} options={options} timeOffset={timeOffset} ws={ws} backBtnPressed={backBtnPressed} multiplayerChatOpen={multiplayerChatOpen} setMultiplayerChatOpen={setMultiplayerChatOpen} multiplayerState={multiplayerState} xpEarned={xpEarned} setXpEarned={setXpEarned} pinPoint={pinPoint} setPinPoint={setPinPoint} loading={loading} setLoading={setLoading} session={session} streetViewShown={streetViewShown} setStreetViewShown={setStreetViewShown} latLong={latLong} loadLocation={() => { }} gameOptions={{ location: "all", maxDist: 20000, extent: gameOptions?.extent ?? multiplayerState?.gameData?.extent,
            nm: multiplayerState?.gameData?.nm,
            npz: multiplayerState?.gameData?.npz,
            showRoadName: multiplayerState?.gameData?.showRoadName
           }} setGameOptions={() => { }} showAnswer={(multiplayerState?.gameData?.curRound !== 1) && multiplayerState?.gameData?.state === 'getready'} setShowAnswer={guessMultiplayer} />
        )}



        <Script id="clarity">
          {`

            window.lastAdShown = Date.now();
            window.gameOpen = Date.now();
          //   try {
          //   if(window.localStorage.getItem("lastAdShown")) {
          //     window.lastAdShown = parseInt(window.localStorage.getItem("lastAdShown"))
          // }
          //   } catch(e) {}
            window.adInterval = 1800000;


            setTimeout(() => {
            if(window.PokiSDK) {
            console.log("Poki SDK found initialized")
            window.PokiSDK.init().then(() => {
    console.log("Poki SDK successfully initialized");
    window.poki = true;
    // fire your function to continue to game
    window.PokiSDK.gameLoadingFinished();

}).catch(() => {
    console.log("Initialized, something went wrong, load you game anyway");
    // fire your function to continue to game
});
            }
}, 1000);

    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ndud94nvsg");

  	window.aiptag = window.aiptag || {cmd: []};
	aiptag.cmd.display = aiptag.cmd.display || [];
	aiptag.cmd.player = aiptag.cmd.player || [];

	//CMP tool settings
	aiptag.cmp = {
		show: true,
		position: "centered",  //centered, bottom
		button: true,
		buttonText: "Privacy settings",
		buttonPosition: "bottom-left" //bottom-left, bottom-right, bottom-center, top-left, top-right
	}
   window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = adConfig = function(o) {adsbygoogle.push(o);}
   adConfig({preloadAdBreaks: 'on'});

   aiptag.cmd.player.push(function() {
	aiptag.adplayer = new aipPlayer({
		AD_WIDTH: Math.min(Math.max(window.innerWidth, 300), 1066),
		AD_HEIGHT: Math.min(Math.max(window.innerHeight, 150), 600),
		AD_DISPLAY: 'modal-center', //default, fullscreen, fill, center, modal-center
		LOADING_TEXT: 'loading advertisement',
		PREROLL_ELEM: function(){ return document.getElementById('videoad'); },
		AIP_COMPLETE: function (state) {
  document.querySelector('.videoAdParent').classList.add('hidden');

    console.log("Ad complete", state)
			// The callback will be executed once the video ad is completed.f
      window.lastAdShown = Date.now();
      try {
      window.localStorage.setItem("lastAdShown", window.lastAdShown)
    } catch(e) {}


			if (typeof aiptag.adplayer.adCompleteCallback === 'function') {
				aiptag.adplayer.adCompleteCallback(state);
			}
		}
	});
});

window.show_videoad = function(callback) {
// if in crazygame (window.inCrazyGames) dont show ads
if(window.inCrazyGames) {
  console.log("In crazygames, not showing ads")
  callback("DISABLED");
  return;
}

          if(window.disableVideoAds) {
          console.log("Video ads disabled")
            callback("DISABLED");
            return;
          }

  if(window.lastAdShown + window.adInterval > Date.now()) {
            callback("COOLDOWN");
            return;
          }

	// Assign the callback to be executed when the ad is done
	aiptag.adplayer.adCompleteCallback = callback;

	// Check if the adslib is loaded correctly or blocked by adblockers etc.
	if (typeof aiptag.adplayer !== 'undefined') {
  console.log("Showing ad")
  // remove 'hidden' class from the parent div
  document.querySelector('.videoAdParent').classList.remove('hidden');
		aiptag.cmd.player.push(function() { aiptag.adplayer.startVideoAd(); });
	} else {
   console.log("Adlib not loaded")
		// Adlib didn't load; this could be due to an ad blocker, timeout, etc.
		// Please add your script here that starts the content, this usually is the same script as added in AIP_COMPLETE.
		aiptag.adplayer.aipConfig.AIP_COMPLETE();
	}
}

  `}
        </Script>
      </main>
    </>
  )
}

