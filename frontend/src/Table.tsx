import React, { useState, useEffect, ReactNode, Key } from 'react';
import axios from 'axios';
import './table.css';
import moment from 'moment';

interface IData {
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
    matches: {
      homeTeam: string;
      awayTeam: string;
      score: string;
      time: string;
      bet: boolean;
    }[];
  }[];
}

interface ILeague {
  name: string;
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
}

interface ITeam {
  id: number;
}

const Table: React.FC = () => {
  const [leagues, setMatchData] = useState<IData[]>([]);
  const [team, setTeamData] = useState<IData[]>([]);

  useEffect(() => {
    async function fetchMatchData(): Promise<any> {
      const leagues = await axios.get('http://localhost:5000/matches');
      const filteredActiveLeagues = filterOldMatches(leagues.data.leagues);
      
      // Loop through each match and fetch team data
      const matchesWithTeamData = await Promise.all(
        
        filteredActiveLeagues.map(async (league: any) => {

          for (const match of league.matches) {
            const homeTeamId = match.home.id;
            const awayTeamId = match.away.id;
      
            const homeTeamName = match.home.name;
            const awayTeamName = match.away.name;
            
            let matchBet = false;
      
            const homeTeamResponse = await axios.get(`http://localhost:5000/teams?id=${homeTeamId}`);
            const homeTeamData: any = homeTeamResponse.data;
          
            // Fetch data for the away team
            const awayTeamResponse = await axios.get(`http://localhost:5000/teams?id=${awayTeamId}`);
            const awayTeamData: any = awayTeamResponse.data;
          
            //get last 5 goals scored
            const homeTeamLastFive = getLastFivegoals(homeTeamName, homeTeamData.overview.teamForm);
            const awayTeamLastFive = getLastFivegoals(awayTeamName, awayTeamData.overview.teamForm);
          
            // Append team data to the match object
            match.home.teamForm = homeTeamLastFive;
            match.away.teamForm = awayTeamLastFive;
          
            match.home.teamFormOverview = { ...match.home.teamFormOverview, ...homeTeamData.overview.teamForm };
            match.away.teamFormOverview = { ...match.away.teamFormOverview, ...awayTeamData.overview.teamForm };
          
            //check teamForm
            if(isSumGreaterThanEight(homeTeamLastFive) && isSumGreaterThanEight(awayTeamLastFive) && hasLessThanTwoZeros(homeTeamLastFive) && hasLessThanTwoZeros(awayTeamLastFive)){
              matchBet = true;
            }

            match.bet = matchBet;
          }

          return league;
        })

      );
      
      return matchesWithTeamData;
    }
    
    // Call the fetchMatchData function
    fetchMatchData()
      .then((matches) => {
        setMatchData(matches);
        console.log(matches); // Process the fetched match data with team data
      })
      .catch((error) => {
        console.error('Error fetching match data:', error);
      });
    


  }, []);

  function formatTime(dateTimeString: string): string {
    return dateTimeString.substring(dateTimeString.indexOf(' ') + 1);
  }

  function filterOldMatches(leagues: IData[]): IData[] {
    const filteredLeagues: IData[] = [];
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      const filteredMatches = league.matches.filter(
        (match: { status: {
          cancelled: any; started: any; 
}; }) => !match.status.started && !match.status.cancelled
      );
      if (filteredMatches.length > 0) {
        filteredLeagues.push({
          ...league,
          matches: filteredMatches,
        });
      }
    }
    return filteredLeagues;
  }

  function isSumGreaterThanEight(arr: number[]): boolean {
    const sum = arr.reduce((acc, curr) => acc + curr, 0);
    return sum >= 8;
  }

  function getLastFivegoals(teamName: string, teamForm: IData[]): number[]{
    const lastFiveGoals: number[] = [];

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
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === 0) {
        count++;
      }
      if (count < 2) {
        return true;
      }
    }
    return false;
  }

  function filterLeaguesWithBetMatches(leagues: IData[]): IData[] {
    const filteredLeagues: IData[] = [];
    for (let i = 0; i < leagues.length; i++) {
      const league = leagues[i];
      // const filteredMatches = league.matches.filter (
      //   (match: { bet: boolean}) => console.log(match)
      // );
      const filteredMatches: IData[] = [];
      for (const match of league.matches) {
          console.log(match.bet);
          
      }
      if (filteredMatches.length > 0) {
        filteredLeagues.push({
          ...league,
          matches: filteredMatches,
        });
      }
    }
    return filteredLeagues;
  }


return (
    <div className="container">
          {leagues.map((league) => (
            <div key={league.id}>
              <h2>{league.name} ({league.ccode})</h2>
              <table className="table">
                <tbody>
                  {league.matches.map((match: {
                    [x: string]: any; id: React.Key | null | undefined; bet: boolean; time: string; home: {
                      teamForm: any; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; 
}; away: {
  teamForm: any; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; 
};
}) => (    
                    <React.Fragment key={match.id}>
                      { (
                        <tr className={match.bet ? 'green-row' : 'red-row'}>
                          <td>{match.home.name}
                          <br />
                          ({match.home.teamForm.toString()})
                          </td>
                          <td>{formatTime(match.time)}</td>
                          <td>{match.away.name}
                          <br />
                          ({match.away.teamForm.toString()})
                          </td>
                          <td>Bet: {match.bet.toString()}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
};

export default Table;
