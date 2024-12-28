import calcPoints from "./calcPoints";
import { useTranslation } from '@/components/useTranslations'

export default function EndInfo({ countryStreaksEnabled, singlePlayerRound, onboarding, countryGuesser, countryGuesserCorrect, options, xpEarned, lostCountryStreak, session, guessed, latLong, pinPoint, countryStreak, fullReset, km, multiplayerState, usedHint, toggleMap, panoShown, setExplanationModalShown }) {
  const { t: text } = useTranslation("common");

  return (
    
    
    <div id='endInfo' style={{ display: guessed ? '' : 'none' }}>
        <div className="bannerContent">
          {pinPoint && (km >= 0) ? (
            <span className='mainBannerTxt'>
              {/* Your guess was {km} km away! */}
                    <div class="row" style={{display: 'flex', justifyContent: 'center', gap: '10px'}} >
        <div class="column">
          <img id="hintgambar1" src={ latLong.gambar1 } width="500" height="500" style={{width: '250px', height: '175px'}}/>
        </div>
        <div class="column">
          <img id="hintgambar2" src={ latLong.gambar2 } width="500" height="500" style={{width: '250px', height: '175px'}}/>
        </div>
        <div class="column">
          <img id="hintgambar3" src={ latLong.gambar3 } width="500" height="500" style={{width: '250px', height: '175px'}} />
        </div>
      </div> 
            </span>
          ) : (
            <span className='mainBannerTxt'>{countryGuesser ? (
              countryGuesserCorrect ? text("correctCountry") : text("incorrectCountry")
            ) : text("didntGuess")}!</span>
          )}
          <p className="motivation">
          {text("info", { namatempat : latLong.namatempat, makanan: latLong.makanan, rumah: latLong.rumah, baju: latLong.baju, tempat: latLong.namatempat})}
          {/* {console.log(latLong)} */}

        </p>
          {/* <p className="motivation">
            {xpEarned > 0 && session?.token?.secret ? text("earnedXP", { xp: xpEarned }) : ''}

          </p>
          {countryStreaksEnabled && (
            <p className="motivation">
              {countryStreak > 0 ? text("onCountryStreak", { streak: countryStreak }) : ''}
              {lostCountryStreak > 0 ? `${text("lostCountryStreak", { streak: lostCountryStreak })}!` : ''}
            </p>
          )}
          <p className="motivation">
            {singlePlayerRound &&

              text("gotPoints", { p: singlePlayerRound.lastPoint })}

          </p> */}
        </div>
        {!multiplayerState && (

          <div className="endButtonContainer">
            {/* <button className="playAgain" onClick={fullReset}>
              {(onboarding && onboarding.round === 5)
                || (singlePlayerRound && singlePlayerRound.round === singlePlayerRound.totalRounds)
                ? text("viewResults") : text("nextRound")}
            </button> */}
            {/* { !onboarding && (
    <button className="openInMaps" onClick={() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latLong.lat},${latLong.long}`);
    }}>
      {text("openInMaps")}
    </button>
    )} */}

            {/* <button className="openInMaps" onClick={() => {
              toggleMap();
            } }>
              {panoShown ? text("showMap") : text("showPano")}
            </button>

            {session?.token?.canMakeClues && (
              <button className="openInMaps" onClick={() => {
                if (!panoShown) toggleMap();
                setExplanationModalShown(true);
              } }>
                {text("writeExplanation")}
              </button>
            )} */}

          </div>
        )}
      </div>
  )
}