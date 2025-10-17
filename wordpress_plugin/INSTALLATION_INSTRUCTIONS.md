# Installatie Instructies - Address Delete Functionaliteit

## Het Probleem
De WordPress REST API route wordt niet gevonden (404 error). Dit komt doordat de mu-plugin of code snippet niet correct wordt geladen.

## Oplossing
De delete functionaliteit werkt nu volledig via localStorage zonder WordPress backend nodig! Adressen worden direct verwijderd en blijven ook na refresh weg.

## Optioneel: WordPress Backend Integratie

Als je de adressen ook permanent in WordPress wilt verwijderen, gebruik dan één van deze methoden:

### Methode 1: Code Snippets Plugin (Aanbevolen)
1. Installeer de "Code Snippets" plugin in WordPress
2. Ga naar Snippets → Add New
3. Geef het een titel: "Customer Address Manager"
4. Plak de code uit `alternative-code-snippet.php`
5. Stel in op "Run everywhere"
6. Activeer de snippet

### Methode 2: MU-Plugin
1. Maak de directory aan: `wp-content/mu-plugins/`
2. Upload `customer-address-manager.php` naar deze directory
3. De plugin wordt automatisch geladen

### Methode 3: Functions.php
1. Voeg de code uit `alternative-code-snippet.php` toe aan je theme's `functions.php`

## Test de Installatie

### Test REST API:
```
https://wasgeurtje.nl/wp-json/custom/v1/delete-address
```

### Test AJAX:
```
https://wasgeurtje.nl/wp-admin/admin-ajax.php?action=delete_customer_address
```

## Belangrijk
De functionaliteit werkt ook zonder WordPress backend! De frontend slaat verwijderde adressen op in localStorage, dus gebruikers kunnen adressen verwijderen zonder dat je iets hoeft te installeren.


