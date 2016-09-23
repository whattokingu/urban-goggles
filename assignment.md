# Url Shortening
## Introduction

This is a website to URL shortening similar to services provided by [bit.ly](www.bitly.com)
The main features are:

1. Generate a short URL when given another URL.
2. Monitor visit and unique counts of the shortened URL.

## Running in localhost

### Pre-reqs
The website is built on Node/Express server, so install Node (I use v5.2.0) and npm (v3.3.12).
[Redis](redis.io) is also used as a simple key-value store - get it running and with default settings. Redis server has to be started before the web server.


### Running
Running the following would start the server. Redis must be already started.
```
npm install
npm start
```

Note that sudo access is required as the app is setting the port number to use to 80.

This is for the redirect url to work without setting a port number(i.e. `localhost`, rather than `localhost:3000`). 

Go to a web browser and type `localhost`.

### Features
The redirect URL is of the form  `<hostname>/u/<shortUrl>`. 

Going to `<hostname>/s/<shortUrl>` would display the counters for the link. Tracked stats are unique counts and total counts.


## Design

### Mapping URLs
When a user enters the curl to be shortened, we first apply a hash function on the URL to obtain a hash. The first 5 (configurable) characters of the hash then become the short URL. 

This is stored in the redis as a key, with the URL as the value, along with the visits and uniques counters.
If there is a hash collision, we add one more character to the short URL and see if it resolves the collision, repeat as necessary.

Note that if the user inputs the same URL multiple times,  the same shortened URL is returned and the counters are **not** reset.

### Storing Unique visits
The set of unique IPs for each link is stored in a separate key from the link itself. The key is basically the shortened hash + IP_POSTFIX (`'+ip'`). 
This is ok because key collision is not possible as the hash function never outputs the `+` character.
Every time the link is hit, we check if the ip address of the client is already in the set, then increment the appropriate counter(s).

### Tradeoffs

#### Key collisions
There is a competing goal to using hashing to map between the URLs: 
1. We want the URL to be as short as possible. 
2. Shorter URL(the key) increases probability of key collisions.

Given that the key length is short, probability of key collisions can increase quite dramatically as more keys are added and hash capacity is maxing out. This can dramatically increase the response time of the server when adding a new url. However, response time of redirecting is not affected, therefore, there is no impact on performance if links are frequently used.

We can increase the default key length when the hash capacity reaches a certain ratio, thereby reducing hash collisions. 

The downside to this is if a user adds the same URL, we get 2 shortened links redirecting to the same site.
Another downside is the utilization of the key space. When the hash capacity gets above certain level, we would want to increase the length of the key to reduce hash collisions. 
That would mean the remaining keyspace for the shorter length would be un-utilized. 

### Additional question

#### Horizontal scaling
This solution can be scaled horizontally relatively easily. We can have a HTTP server that divides the workload out by looking at the first *n* characters of the short URL, sending them on to individual servers, 
each running on its own machine and redis server. For example, a server might handle urls with a 1st character being digits and the other handles the alphabets. 
Given that the output of SHA256 is relatively uniform and random, we can expect a uniform distribution of workload across the servers. 
(note: the workload in the above example would likely not be random as there are more alphabets than digits.)

#### Handling spikes in traffic
Scaling horizontally would not be an ideal case if the traffic is not consistently high, but has spikes. Redis is an in-memory data store, so retrievals should already be quite fast.
The following can possible speed up the redirect:
The current design lookup the counters and redirect URL for each link, then store the updated counters before redirecting user to the long URL.
Caching the most the visited links and counters in a javascript object in-memory rather than querying and updating the redis store every time a redirect request is received can possibly help handle a bit more load. 
An event can be set to fire every few seconds to flush the cache to redis, batching up the updates.

## Ack
The site is generated using [this](https://expressjs.com/en/starter/generator.html).
