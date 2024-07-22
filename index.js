require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const {URL} = require('url');
const fs = require('fs');

const app = express();
const url_list_path = "./url_list.json";

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.post('/api/shorturl', (req,res)=>{
  
  var req_url = req.body.url;
  try {
    var parsed_url = new URL(req_url);
    var hostname = parsed_url.hostname;

    dns.lookup(hostname, (err, addr, fam)=>{

      if (err){
        res.json({error: "Invalid url"});
      }
      else checkURL(req_url, res);
    });
  }
  catch (error){
    res.json({error: "Invalid url"});
  }
  
})

app.get('/api/shorturl/:shorturl', (req,res)=>{

  var req_short_url = req.params.shorturl;
  fs.readFile(url_list_path, 'utf-8', (err, data)=>{
    if (err) return res.status(500).send('Error reading URL list');
    const url_list = JSON.parse(data);
    const target_url = url_list.urls.find(entry=>entry.short===req_short_url);
    if (target_url) return res.redirect(target_url.original);
    else return res.json({"error":"No short URL found for the given input"});
  })
})

var checkURL = (url, res) => {
  fs.readFile(url_list_path, 'utf-8', (err, data)=>{
    if (err) return res.status(500).send('Error reading URL list');
    
    const url_list = JSON.parse(data);
    const target_url = url_list.urls.find(entry => entry.original === url);

    if (target_url){
      res.json({"original_url": url, "short_url": target_url.short});
    }
    else {
      const newShort = (url_list.urls.length + 1).toString();
      const newEntry = {original: url, short: newShort};

      url_list.urls.push(newEntry);

      fs.writeFile(url_list_path, JSON.stringify(url_list,null,2), err => {
        if (err) res.status(500).send('Error saving URL list');
        else res.json({"original_url": url, "short_url": newShort});
      });
    }
  })
}