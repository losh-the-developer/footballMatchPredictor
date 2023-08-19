import React, { useState, useEffect, ReactNode, Key } from 'react';
import axios from 'axios';
import './table.css';

interface IData {
  avgGoalsPerMatch: number;
  totalGoals: any;
  winPercentage: any;
  tooltipText: any;
  awayScore(awayScore: any): unknown;
  homeTeam: any;
  homeScore(homeScore: any): unknown;
  matches: any;
  id: Key | null | undefined;
  name: ReactNode;
  ccode: string;
  league: {
    name: string;
    ccode: string;
    country: string;
    winPercentage: number;
    matches: {
      homeTeam: string;
      awayTeam: string;
      score: string;
      time: string;
      bet: boolean;
      outcome: string;
    }[];
  }[];
}

interface ILeague {
  id: any;
  league: string;
  ccode: string;
  matches: IMatch[];
}

interface IMatch {
  id: number;
  start: string;
  bet: boolean;
  status: {
    started: boolean;
    cancelled : boolean;
  };
  home: {
    hotForm: any;
    name: string;
    teamForm: any;
    score: any;
  };
  away: {
    hotForm: any;
    name: string;
    teamForm: any;
    score: any;
  };
  time: string;
  outcome: string;
}

interface ITeam {
  id: number;
}

// Loading spinner component
const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner">
        <div className="spinner-inner" />
      </div>
    </div>
  );
}

  const Bets: React.FC = () => {
  const [leagues, setMatchData] = useState<IData[]>([]);
  const [allBetMatches, setAllBetMatches] = useState<ILeague[]>([]);
  const [notStartedBetMatches, setNotStartedBetMatches] = useState<ILeague[]>([]);
  const [currentlyPlayingBetMatches, setCurrentlyPlayingBetMatches] = useState<ILeague[]>([]);
  const [finishedBetMatches, setFinishedBetMatchess] = useState<ILeague[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMatchData(): Promise<any> {
      const leagues = await axios.get('http://localhost:5555/matches?date=20230812');
      //const filteredActiveLeagues = filterOldMatches(leagues.data.leagues);
      const filteredActiveLeagues = leagues.data.leagues;
      let notStartedBetLeauges: { id: any; league: any; matches: any[]; ccode: any; }[] = [];
      let currentlyPlayingBetLeauges: { id: any; league: any; matches: any[]; ccode: any; }[] = [];
      let finishedBetLeauges: { id: any; league: any; matches: any[]; ccode: any; }[] = [];
      let allBetLeauges: { id: any; league: any; matches: any[]; ccode: any; }[] = [];

      const dateOfData = new Date(filteredActiveLeagues[0].matches[0].time);
      let isDateBeforeToday: boolean = BeforeToday(dateOfData);
      const matchesWithTeamData = await Promise.all(
        filteredActiveLeagues.map(async (league: any) => {
          let allBetMatches = [];
          let notStartedBetMatches = [];
          let currentlyPlayingBetMatches = [];
          let finishedBetMatches = [];
           // Loop through each match and fetch team data
          for (const match of league.matches) {
            const homeTeamId = match.home.id;
            const awayTeamId = match.away.id;
      
            const homeTeamName = match.home.name;
            const awayTeamName = match.away.name;
            
            let matchBet = false;
      
            const homeTeamData: any = fetchTeamData(homeTeamId);
            const awayTeamData: any = fetchTeamData(awayTeamId);

            let homeTeamForm = [];
            let awayTeamForm = [];

            if (homeTeamData && homeTeamData.overview && homeTeamData.overview.teamForm) {
              homeTeamForm = homeTeamData.overview.teamForm;
            }

            if (awayTeamData && awayTeamData.overview && awayTeamData.overview.teamForm) {
              awayTeamForm = awayTeamData.overview.teamForm;
            }

            //get last 5 goals scored
            const homeTeamLastFive = getLastFivegoals(homeTeamName, homeTeamForm);
            const awayTeamLastFive = getLastFivegoals(awayTeamName, awayTeamForm);
          
            // Append team data to the match object
            match.home.teamForm = homeTeamLastFive;
            match.away.teamForm = awayTeamLastFive;
            let homeLastFiveGoalAvg = 0;
            let awayLastFiveGoalAvg = 0;

            if(homeTeamLastFive && homeTeamLastFive.length !== 0){
              homeLastFiveGoalAvg = (homeTeamLastFive.reduce((result,number)=> result+number))/homeTeamLastFive.length;
              match.home.hotForm = checkTeamsFormTwoAndAboveGoals(homeTeamLastFive) && homeLastFiveGoalAvg >= 3;
            }
              
            if(awayTeamLastFive && awayTeamLastFive.length !== 0){
              awayLastFiveGoalAvg = (awayTeamLastFive.reduce((result,number)=> result+number))/awayTeamLastFive.length;
              match.away.hotForm = checkTeamsFormTwoAndAboveGoals(awayTeamLastFive) && homeLastFiveGoalAvg >= 3;
            }

            match.home.lastFiveGoalAvg =  Math.round(homeLastFiveGoalAvg);
            match.away.lastFiveGoalAvg =  Math.round(awayLastFiveGoalAvg);

            match.home.teamFormOverview = { ...match.home.teamFormOverview, ...homeTeamForm };
            match.away.teamFormOverview = { ...match.away.teamFormOverview, ...awayTeamForm };
          
            //check if its bet worthy
            if(
              (isSumGreaterThanEight(homeTeamLastFive) && isSumGreaterThanEight(awayTeamLastFive) && 
              hasLessThanTwoZeros(homeTeamLastFive) && hasLessThanTwoZeros(awayTeamLastFive) && 
              //hasStrongForm(homeTeamLastFive) && hasStrongForm(awayTeamLastFive) && 
              (homeLastFiveGoalAvg >= 2 && awayLastFiveGoalAvg >= 2))
               || (match.home.hotForm || match.away.hotForm)
              ){
              matchBet = true;
            }

            match.bet = matchBet;

            if(matchBet && !match.status.cancelled){
              allBetMatches.push(match);
            }

            if(matchBet && (!match.status.started || !isGameStarted(match.time)) && !match.status.cancelled){
              notStartedBetMatches.push(match);
            }

            if(matchBet && (match.status.started || isGameStarted(match.time)) && !match.status.finished && !match.status.cancelled){
              currentlyPlayingBetMatches.push(match);
            } 

            if(match.status.started && !match.status.cancelled && match.status.finished){
              const totalGoals = match.home.score + match.away.score;
              match.outcome = totalGoals > 1 ? 'win' : 'lose';
              if(matchBet){
                finishedBetMatches.push(match);
              }
            }
          }

          if(allBetMatches.length > 0){
            allBetLeauges.push({
              "id": league.id,
              "league" : league.name,
              "matches" : allBetMatches,
              "ccode" : league.ccode
            })
          }

          if(notStartedBetMatches.length > 0){
            notStartedBetLeauges.push({
              "id": league.id,
              "league" : league.name,
              "matches" : notStartedBetMatches,
              "ccode" : league.ccode
            })
          }

          if(currentlyPlayingBetMatches.length > 0){
            currentlyPlayingBetLeauges.push({
              "id": league.id,
              "league" : league.name,
              "matches" : currentlyPlayingBetMatches,
              "ccode" : league.ccode
            })
          }

          if(finishedBetMatches.length > 0){
            finishedBetLeauges.push({
              "id": league.id,
              "league" : league.name,
              "matches" : finishedBetMatches,
              "ccode" : league.ccode
            })
          }

          //set League win percentages if its matches in the past
          //TODO: check the date
          setLeagueWinPercentage(league);
          setAvgGoalsPerMatch(league);

          return league;
        })
      );

      setAllBetMatches(notStartedBetLeauges);
      setNotStartedBetMatches(notStartedBetLeauges);
      setFinishedBetMatchess(finishedBetLeauges);
      setCurrentlyPlayingBetMatches(currentlyPlayingBetLeauges);
      
      //if its before today sort leagues by win percentage
      matchesWithTeamData.sort((a, b) => (a.winPercentage > b.winPercentage) ? -1 : 1);

      return matchesWithTeamData;
    }

    const fetchTeamData = async (teamId: any) => {
      try {
        const response = await axios.get(`http://localhost:5555/teams?id=${teamId}`);
        const data = response.data;
        return data;
      } catch (error) {
        console.error("Error fetching team data:", error);
        return null; // Return null or some default value indicating an error
      }
    };
    
    // Call the fetchMatchData function
    fetchMatchData()
      .then((matches) => {
        setMatchData(matches);
        setIsLoading(false);
        console.log('matches: ', matches); // Process the fetched match data with team data
        console.log('finishedBetMatches', finishedBetMatches);
      })
      .catch((error) => {
        console.error('Error fetching match data:', error);
        setIsLoading(false);
      });
    
  }, []);

  function BeforeToday(date:string | number | Date): boolean {
    return new Date(date) < new Date();
  }

  function formatTime(dateTimeString: string): string {
    return dateTimeString.substring(dateTimeString.indexOf(' ') + 1);
  }

  function isGameStarted(dateString: string): boolean {
    // Convert the given date string into a Date object
    var gameTime = new Date(dateString.replace(/(\d{2}).(\d{2}).(\d{4}) (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5'));

    // Create a new Date object for the current date and time
    var currentDateTime = new Date();
    // Compare the two Date objects
    return gameTime < currentDateTime;
  }

  function getBetsWinPercentage(leagues: ILeague[]): [number, number, number] {
    let totalMatches = 0;
    let totalMatchesWon = 0;

    leagues.forEach((league) => {
      totalMatches += league.matches.length;

      league.matches.forEach((match: { outcome: string; }) => {
        totalMatchesWon += match.outcome === 'win' ? 1 : 0;
      })
    });
    return [totalMatches, totalMatchesWon, Math.round(totalMatchesWon/totalMatches * 100)];
  }

  function setLeagueWinPercentage(league: IData){
    let totalMatches = 0;
    let totalMatchesWon = 0;

      totalMatches += league.matches.length;
      league.matches.forEach((match: { outcome: string; }) => {
        totalMatchesWon += match.outcome === 'win' ? 1 : 0;
      })

    league.winPercentage = Math.round(totalMatchesWon/totalMatches * 100);
  }

  function setAvgGoalsPerMatch(league: IData){
    let totalMatches = 0;
    let totalGoals = 0;

      totalMatches += league.matches.length;
      league.matches.forEach((match: any) => {
        match.totalGoals = match.home.score + match.away.score;
        totalGoals += match.home.score + match.away.score;
      })

      league.totalGoals = totalGoals;
      let avgGoals = totalGoals/totalMatches;
      avgGoals = Math.round(avgGoals * 10) / 10;
      league.avgGoalsPerMatch = avgGoals;
  }

  function checkTeamsFormTwoAndAboveGoals(form: number[]): boolean {
    if(form.length < 3){
      return false;
    }

    for (let i = 0; i < form.length; i++) {
      if (form[i] < 2) {
        return false;
      }
    }
    return true;
  }

  function isSumGreaterThanEight(arr: number[]): boolean {
    const sum = arr.reduce((acc, curr) => acc + curr, 0);
    return sum >= 8;
  }

  function getLastFivegoals(teamName: string, teamForm: IData[]): number[]{
    const lastFiveGoals: number[] = [];

    if (!teamForm || !Array.isArray(teamForm)) {
      // Handle the case where 'matches' is not defined or is not an array
      return [];
    }

    teamForm.forEach(match => {
      if (teamName === match.tooltipText.awayTeam) {
        lastFiveGoals.push(match.tooltipText.awayScore);
      } else {
        lastFiveGoals.push(match.tooltipText.homeScore);
      }
    });

    return lastFiveGoals;
  }

  function hasLessThanTwoZeros(arr: number[]): boolean {
    if(arr.length > 3){
      let count = 0;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 0) {
          count++;
        }
      }
      if (count < 2) {
        return true;
      }
    }
    
    return false;
  }

  function hasStrongForm(arr: number[]): boolean {
    // count the number of ones and zeros
    // if there is 1 zero there can only be 1 one
    
    // Check if zero exist
    if(arr.length > 3){
      let zeros = 0;
      let ones = 0;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === 0) {
          zeros++;
        }

        if (arr[i] === 1) {
          ones++;
        }
      }
      if (zeros > 1) {
        return false;
      } else if(zeros === 1 && ones > 1){
        return false;
      }
    }

    return true;
  }

return (
  isLoading ? (
    <Spinner />
  ) : 
    <div className="container">
      <h1>Betting Page</h1>
      <div className="table-container">
      {leagues.map((league) => (
            <div key={league.id}>
              <h2>{league.name} ({league.ccode})</h2>
              <hr />
              <h3>Win percentage: {league.winPercentage}% <br /> Average Goals Per Match: { league.avgGoalsPerMatch }</h3>
              <table className="table">
                <tbody>
                  {league.matches.map((match: {
                    [x: string]: any; id: React.Key | null | undefined; bet: boolean; time: string; home: {
                      hotForm: any;
                      hot: any;
                      lastFiveGoalAvg: ReactNode;
                      teamForm: any; score: any; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; 
                                }; away: {
                                  hotForm: any;
                                  hot: any;
                                  lastFiveGoalAvg: ReactNode;
                                  teamForm: any; score: any; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; 
                                };
                  }) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={`${match.bet ? 'green-row' : 'red-row'} ${match.status.started ? 'match-started' : 'match-not-started'}`}>
                          <td>{match.home.name} { match.home.hotForm ? '🔥' : ''}
                          <hr />
                          ({match.home.teamForm.toString()})
                          <hr />
                          GA: { match.home.lastFiveGoalAvg }
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name} { match.away.hotForm ? '🔥' : ''} 
                          <hr />
                          ({match.away.teamForm.toString()})
                          <hr />
                          GA: { match.away.lastFiveGoalAvg }
                          </td>
                          <td>Bet: {match.bet.toString()}</td>
                          <td>score: {match.home.score.toString()} - {match.away.score.toString()} ({match.home.score + match.away.score})</td>
                          {/* <td className={`${match.home.score + match.away.score > 1 ? 'match-won' : 'match-lost'}`}  ></td> */}
                          <td className={`${match.status.started ? match.home.score + match.away.score > 1 ? 'match-won' : 'match-lost' : ''}`}></td>
                         </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
   

<div className="table-container">
<div className='allBetMatches'>
<h1 style={{ textTransform: 'uppercase' }}> All Betting matches (over 1.5): ({ allBetMatches.length }) </h1>

{allBetMatches.map((league) => (
            <div key={league.id}>
              <h2>{league.league} ({league.ccode})</h2>
              <table className="table">
                <tbody>
                  {league.matches.map((match) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={`${match.bet ? 'green-row' : 'red-row'} ${match.status.started ? 'match-started' : 'match-not-started'}`}>
                          <td>{match.home.name} { match.home.hotForm ? '🔥' : ''}
                          <br />
                          ({match.home.teamForm.toString()})
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name} { match.away.hotForm ? '🔥' : ''}
                          <br />
                          ({match.away.teamForm.toString()})
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
</div>

<div className='notStartedBetMatches'>
<h1 style={{ textTransform: 'uppercase' }}> Betting matches not started yet (over 1.5): ({ notStartedBetMatches.length }) </h1>

{notStartedBetMatches.map((league) => (
            <div key={league.id}>
              <h2>{league.league} ({league.ccode})</h2>
              <table className="table">
                <tbody>
                  {league.matches.map((match) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={`${match.bet ? 'green-row' : 'red-row'} ${match.status.started ? 'match-started' : 'match-not-started'}`}>
                          <td>{match.home.name} { match.home.hotForm ? '🔥' : ''}
                          <br />
                          ({match.home.teamForm.toString()})
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name} { match.away.hotForm ? '🔥' : ''}
                          <br />
                          ({match.away.teamForm.toString()})
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
</div>


<div className='currentlyPlayingBetMatches'>
<h1 style={{ textTransform: 'uppercase' }}> Currently Playing (over 1.5): ({ currentlyPlayingBetMatches.length }) </h1>

{currentlyPlayingBetMatches.map((league) => (
            <div key={league.id}>
              <h2>{league.league} ({league.ccode})</h2>
              <table className="table">
                <tbody>
                  {league.matches.map((match) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={`${match.bet ? 'green-row' : 'red-row'} ${match.status.started ? 'match-started' : 'match-not-started'}`}>
                          <td>{match.home.name} { match.home.hotForm ? '🔥' : ''}
                          <br />
                          ({match.home.teamForm.toString()})
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name} { match.away.hotForm ? '🔥' : ''}
                          <br />
                          ({match.away.teamForm.toString()})
                          </td>
                          <td>score: {match.home.score.toString()} - {match.away.score.toString()} ({match.home.score + match.away.score})</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
</div>

<div className='finishedBetMatches'>
<h1 style={{ textTransform: 'uppercase' }}> finished Betting matches (over 1.5): </h1>
<hr />
<h2> { finishedBetMatches.length > 0 ? getBetsWinPercentage(finishedBetMatches)[2] : 0 }  % Win ({ getBetsWinPercentage(finishedBetMatches)[1] }/{ getBetsWinPercentage(finishedBetMatches)[0] })</h2>

{finishedBetMatches.map((league) => (
            <div key={league.id}>
              <h2>{league.league} ({league.ccode})</h2>
              <table className="table">
                <tbody>
                  {league.matches.map((match) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={match.home.score + match.away.score > 1 ? 'green-row' : 'red-row'}>
                          <td>{match.home.name} { match.home.hotForm ? '🔥' : ''}
                          <br />
                          ({match.home.teamForm.toString()})
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name} { match.away.hotForm ? '🔥' : ''}
                          <br />
                          ({match.away.teamForm.toString()})
                          </td>
                          <td>score: {match.home.score.toString()} - {match.away.score.toString()} ({match.home.score + match.away.score})</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
</div>
</div>
        </div>
      );
};

export default Bets;
