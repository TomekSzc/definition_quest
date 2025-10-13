# Dokument wymagań produktu (PRD) - Definition Quest

## 1. Przegląd produktu
Definition Quest to aplikacja webowa (MVP) wspierająca naukę definicji poprzez angażującą grę memory‐match. Użytkownik wkleja materiał tekstowy lub ręcznie wprowadza pary „słowo – definicja”, z których tworzona jest plansza 16 lub 24 kart. Poprawne dopasowanie par powoduje usunięcie kart i zatrzymanie timera po ukończeniu. Aplikacja priorytetowo wykorzystuje generowanie plansz przez AI, oferuje podstawowe konta użytkowników, zapis wyników oraz możliwość udostępniania plansz publicznie.

### Cele produktu
1. Skrócenie czasu potrzebnego na naukę definicji.
2. Zwiększenie motywacji poprzez element grywalizacji i pomiar czasu.
3. Dostarczenie łatwego w użyciu generatora plansz opartego o AI (> 75 % akceptowalnych par).
4. Udostępnienie społecznościowej bazy plansz do nauki różnych zagadnień.

### Grupa docelowa
Uczniowie szkół średnich, studenci i kursanci w wieku 16–80 lat uczący się teorii wymagającej zapamiętywania definicji.

### Zakres MVP (wysoki poziom)
• Generowanie/edycja plansz, gra memory, konta użytkowników, prosta analityka, desktop-first.

## 2. Problem użytkownika
Nauka definicji z tradycyjnych notatek bywa żmudna, szczególnie dla osób z problemami z koncentracją. Przepisywanie fiszek lub ręczne układanie par zajmuje czas, a brak natychmiastowej informacji zwrotnej demotywuje. Użytkownicy potrzebują szybkiego sposobu konwersji materiału tekstowego w interaktywną grę, która:
• automatyzuje tworzenie kart,
• pozwala edytować błędy AI,
• mierzy postępy (czas),
• przechowuje wyniki do dalszych porównań.

## 3. Wymagania funkcjonalne
1. Konto użytkownika: rejestracja, logowanie (OAuth lub JWT).
2. Tworzenie planszy:
   a. Wprowadzenie tekstu ≤ 5 000 znaków → AI generuje pary.
   b. Edycja / usuwanie par przed zapisem.
   c. Alternatywnie: ręczne dodawanie par (max 16/24 kart).
3. Limity AI: 50 zapytań / dobę / użytkownik.
4. Rozwiązywanie planszy:
   • desktop-only widok gry,
   • możliwość zaznaczenia jednocześnie maks. 2 kart,
   • znikanie poprawnie dobranych kart,
   • pomiar i zapis czasu,
   • reset planszy i timera po odświeżeniu.
5. Przeglądanie, wyszukiwanie i sortowanie plansz:
   • własnych (edycja, archiwizacja, rozwiązywanie),
   • publicznych innych użytkowników (rozwiązywanie).
6. Zapisywanie wyników w Supabase Postgres.
7. Analityka (Google Analytics): eventy create_board, solve_board, time_spent; baner zgody GDPR, anonimizacja IP.
8. Backup bazy (codziennie) oraz pole archived zamiast trwałego kasowania plansz.
9. Dostępność podstawowa: kontrast, focus-ring, aria-labels, obsługa klawisza Tab.
10. i18n-ready (angielski hard-coded w MVP, struktura JSON na przyszłość).

## 4. Granice produktu
• Brak ról (nauczyciel/uczeń), obserwowania użytkowników, mobilnej aplikacji i pełnego RWD (gra wyłącznie desktop).
• Brak moderacji treści i wersjonowania plansz w MVP.
• Integracje z zewnętrznymi platformami edukacyjnymi poza zakresem.
• Onboarding, zbieranie feedbacku, zaawansowana dostępność (pełne WCAG) – poza MVP.
• Tylko darmowy model AI w pierwszej fazie (potencjalna migracja do płatnego później).

## 5. Historyjki użytkowników
| ID | Tytuł | Opis | Kryteria akceptacji |
|----|-------|------|----------------------|
| US-001 | Rejestracja i logowanie | Jako nowy użytkownik chcę utworzyć konto i logować się, aby przechowywać swoje plansze i wyniki. | • Formularz OAuth/JWT działa.<br>• Po zalogowaniu dostępne są funkcje tworzenia i zapisu.<br>• Nie zalogowany widzi przycisk „Log in”. |
| US-002 | Ręczne tworzenie planszy | Jako autor chcę ręcznie dodać pary słowo-definicja, gdy AI nie jest potrzebne. | • Formularz dodawania par działa.<br>• Limit 16/24 kart z walidacją.<br>• Zapis tworzy planszę. 
| US-003 | Edycja wygenerowanych par | Jako użytkownik chcę poprawiać lub usuwać błędne pary przed publikacją planszy. | • Interfejs pozwala edytować tekst obu pól.<br>• Można usuwać pary.<br>• Walidacja: min. 1 para przed zapisem.<br>• Zapis tworzy planszę w DB. |
| US-004 | Generowanie planszy przez AI | Jako uczeń chcę wkleić notatki (≤ 5 000 znaków) i otrzymać planszę, aby szybciej się uczyć. | • Po wklejeniu tekstu i kliknięciu „Generate” AI zwraca ≤ 24 par w ≤ 10 s.<br>• ≥ 75 % par jest poprawnych wg użytkownika.<br>• Plansza można zapisać lub edytować przed zapisem. | Po wygenerowaniu formularz manualnego wypełniania zostaje automatycznie uzupełniony
| US-005 | Rozwiązywanie planszy | Jako gracz chcę dopasować pary na planszy i zobaczyć czas ukończenia. | • Można zaznaczyć max 2 karty jednocześnie.<br>• Poprawne pary znikają.<br>• Timer start/stop działa.<br>• Wynik zapisany w DB. |
| US-006 | Reset zabezpieczający | Jako gracz nie chcę oszukiwać przez odświeżenie strony. | • Odświeżenie resetuje planszę i timer.<br>• Wynik nie jest zapisany. |
| US-007 | Przeglądanie własnych plansz | Jako autor chcę listować moje plansze, aby je przeglądać. | • Lista pokazuje tytuł, datę, liczbę kart.<br>• Dostępne przyciski edytuj, usuń, rozwiąż. |
| US-008 | Edycja planszy | Jako autor chcę edytować istniejącą planszę. | • Formularz edycji ładuje aktualne pary.<br>• Zmiany zapisywane w DB. |
| US-009 | Usuwanie/archiwizacja planszy | Jako autor chcę usuwać niepotrzebne plansze. | • Kliknięcie „Delete” ustawia archived=true.<br>• Plansza znika z listy aktywnych. |
| US-010 | Przeglądanie publicznych plansz | Jako użytkownik chcę rozwiązywać plansze innych, aby ćwiczyć różne tematy. | • Widok public boards listuje dostępne plansze.<br>• Kliknięcie otwiera grę w trybie bez edycji.<br>• Wynik zapisywany do moich statystyk. |
| US-011 | Wyszukiwanie plansz | Jako użytkownik chcę filtrować plansze po tytule i autorze. | • Pole search filtruje listę w czasie rzeczywistym.<br>• Zapamiętywane jest ostatnie zapytanie w URL. |
| US-012 | Limity AI | Jako użytkownik chcę znać dzienny limit zapytań AI i otrzymać komunikat po jego przekroczeniu. | • Licznik zapytań widoczny w UI.<br>• Po 50. zapytaniu przycisk „Generate” jest nieaktywny. |
| US-013 | Analityka zdarzeń | Jako właściciel produktu chcę rejestrować kluczowe zdarzenia, aby analizować użycie. | • Eventy create_board, solve_board, time_spent wysyłane do GA.<br>• Baner zgody pojawia się przed aktywacją GA.<br>• IP anonimizowane. |
| US-014 | Dostępność podstawowa | Jako użytkownik z niepełnosprawnością wzroku chcę obsłużyć aplikację klawiaturą i mieć odpowiedni kontrast. | • Focus-ring widoczny na wszystkich interaktywnych elementach.<br>• Kontrast tekstu min. 4.5:1.<br>• Wszystkie elementy mają aria-label.

## 6. Metryki sukcesu
1. ≥ 50 % zarejestrowanych użytkowników tworzy ≥ 1 planszę.
2. ≥ 75 % użytkowników rozwiązuje ≥ 1 planszę.
3. ≥ 75 % par generowanych przez AI akceptowane bez edycji.
4. Średni czas odpowiedzi AI ≤ 10 s.
5. Retencja tygodniowa ≥ 25 %.
6. Średni czas gry na planszy ≥ 60 s.
7. Liczba zapytań AI na użytkownika < 50 / dobę (limit nieprzekraczany).
