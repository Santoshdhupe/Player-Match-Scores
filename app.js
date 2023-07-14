const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3"); 
const path = require("path");

const app = express();
app.use(express.json()); 

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let dataBase = null;

const initializeDBAndServer = async () => {
    try {
        dataBase = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, () => {
            console.log("Server running at http://localhost:3000/");
        });
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    };

};

initializeDBAndServer(); 

const convertPlayerDetailsDBobjectToResponseObject = (data) => {
    return {
        playerId: data.player_id,
        playerName: data.player_name
    };
}; 


const convertMatchDetailsDBobjectToResponseObject = (data) => {
    return {
        matchId: data.match_id,
        match: `${data.match}`,
        year:  data.year
    };
};


app.get("/players/", async (request, response) => {
    const getPlayersQuery = 
    `SELECT * FROM player_details`; 
     
    const playersArray = await dataBase.all(getPlayersQuery);
    response.send(playersArray.map((eachPlayer) => convertPlayerDetailsDBobjectToResponseObject(eachPlayer)));
});



app.get("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerQuery = 
    `SELECT * FROM player_details WHERE player_id = ${playerId};`;
    
    const player = await dataBase.get(getPlayerQuery);
    response.send(convertPlayerDetailsDBobjectToResponseObject(player));
});



app.put("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const { playerName } = request.body; 
    const updatePlayerQuery = 
    `UPDATE player_details SET player_name = '${ playerName }';`;

     await dataBase.run(updatePlayerQuery);
     response.send("Player Details Updated");
});



app.get("/matches/:matchId/", async (request, response) => {
    const { matchId } = request.params;
    const getMatchDetailsQuery = 
    `SELECT * FROM match_details WHERE match_id = ${ matchId };` ;
    
    const matchDetails = await dataBase.get(getMatchDetailsQuery);  
    response.send({
        matchId: matchDetails.match_id,
        match: matchDetails.match,
        year: matchDetails.year
    });

}); 


app.get("/players/:playerId/matches/", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerMatchesQuery = 
    `SELECT 
       * 
    FROM 
        match_details
        NATURAL JOIN  player_match_score              
    WHERE 
       player_id = ${ playerId };`   

    const matchesArray = await dataBase.all(getPlayerMatchesQuery);   
    response.send(matchesArray.map((eachMatch) => convertMatchDetailsDBobjectToResponseObject(eachMatch)));
});


app.get("/matches/:matchId/players", async (request, response) => {
     const { matchId } = request.params;
     const getPlayersQuery = 
     `SELECT * 
     FROM player_match_score 
     NATURAL JOIN player_details 
     WHERE 
     match_id = ${ matchId };`;

     const players = await dataBase.all(getPlayersQuery);  
     response.send(players.map((eachPlayer) => convertPlayerDetailsDBobjectToResponseObject(eachPlayer)));
});


app.get("/players/:playerId/playerScores", async (request, response) => {
    const { playerId } = request.params;
    const getPlayerScoresQuery = 
    `SELECT 
    player_id as playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes 
    FROM 
    player_match_score 
    NATURAL JOIN player_details
    WHERE player_id = ${ playerId };` ;

    const playerScores = await dataBase.get(getPlayerScoresQuery);
    response.send(playerScores);
})

module.exports = app;