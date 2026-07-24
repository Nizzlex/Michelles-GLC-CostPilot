/** Beispiel-Backend (Node/Express). Nicht direkt auf GitHub Pages ausführen.
 * OAuth-URLs, Scopes und API-Endpunkte müssen aus deinem freigeschalteten
 * Mercedes-Benz Developer-Produkt übernommen werden.
 */
import express from 'express'; import session from 'express-session';
const app=express();app.use(session({secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,secure:true,sameSite:'lax'}}));
app.get('/api/mercedes/connect',(req,res)=>{req.session.returnTo=req.query.returnTo;const p=new URLSearchParams({response_type:'code',client_id:process.env.MB_CLIENT_ID,redirect_uri:process.env.MB_REDIRECT_URI,scope:process.env.MB_SCOPES,state:crypto.randomUUID()});req.session.oauthState=p.get('state');res.redirect(process.env.MB_AUTH_URL+'?'+p)});
app.get('/api/mercedes/callback',async(req,res)=>{/* Code gegen Token tauschen, Token serverseitig verschlüsselt speichern. */res.redirect(req.session.returnTo||'/')});
app.get('/api/mercedes/vehicle',async(req,res)=>{/* Mercedes API abrufen und auf dieses neutrale Format mappen. */res.json({odometer:null,fuelLevel:null,stateOfCharge:null,electricRange:null,electricConsumption:null,petrolConsumption:null,hybridElectricConsumption:null,hybridPetrolConsumption:null,updatedAt:Date.now()})});
app.listen(process.env.PORT||3000);
