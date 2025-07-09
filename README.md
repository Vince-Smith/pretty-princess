# Pretty Pretty Princess SIM

Simulates games of pretty pretty princess to determine the average length of a game

## How To Run

```sh
npm install
npm run start
```

## Findings

Simulating 1,000,000 games...

|Player Count|Average|Median|Min|Max|
|:--|:--|:--|:--|:--|
|2|34|31|9|187|
|3|45|42|13|213|
|4|56|53|17|286|

1. Fewer players results in fewer turns
1. All things being random... the maximum length of a game can easily explode
