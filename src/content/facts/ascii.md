---
id: ascii
title: ASCII tabulka (znaky 0–127)
category: Kódy & technika
keywords: ascii, tabulka, kód, znaky, dec, hex, bin, číselné hodnoty, informatika, binární kód, hexadecimální, počítače, znaková sada
---

7bitová znaková sada (American Standard Code for Information Interchange). Obsahuje 128 kódů (0–127): 33 řídicích znaků (0–31 a 127) a 95 tisknutelných znaků (32–126).

### Šifrovací zkratky a pravidla

- **Mezera:** Dec `32` (Hex `20`, Bin `00100000`)
- **Číslice 0–9:** Dec `48–57` (Hex `30–39`) ➔ `Dec - 48 = číslice`
- **Velká písmena A–Z:** Dec `65–90` (Hex `41–5A`) ➔ `Dec - 64 = pořadí v abecedě (A=1)`
- **Malá písmena a–z:** Dec `97–122` (Hex `61–7A`) ➔ `Dec - 96 = pořadí v abecedě (a=1)`
- **Převod velká ↔ malá písmena:** Rozdíl přesně **32** (Hex `0x20`, bit 5).

### Písmena a číslice

<table>
  <thead>
    <tr>
      <th class="col-code">Znak</th>
      <th class="col-val">Dec</th>
      <th class="col-val">Hex</th>
      <th class="col-val">Binárně</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="col-code"><strong>0</strong></td><td class="col-val">48</td><td class="col-val">30</td><td class="col-val">00110000</td></tr>
    <tr><td class="col-code"><strong>1</strong></td><td class="col-val">49</td><td class="col-val">31</td><td class="col-val">00110001</td></tr>
    <tr><td class="col-code"><strong>2</strong></td><td class="col-val">50</td><td class="col-val">32</td><td class="col-val">00110010</td></tr>
    <tr><td class="col-code"><strong>3</strong></td><td class="col-val">51</td><td class="col-val">33</td><td class="col-val">00110011</td></tr>
    <tr><td class="col-code"><strong>4</strong></td><td class="col-val">52</td><td class="col-val">34</td><td class="col-val">00110100</td></tr>
    <tr><td class="col-code"><strong>5</strong></td><td class="col-val">53</td><td class="col-val">35</td><td class="col-val">00110101</td></tr>
    <tr><td class="col-code"><strong>6</strong></td><td class="col-val">54</td><td class="col-val">36</td><td class="col-val">00110110</td></tr>
    <tr><td class="col-code"><strong>7</strong></td><td class="col-val">55</td><td class="col-val">37</td><td class="col-val">00110111</td></tr>
    <tr><td class="col-code"><strong>8</strong></td><td class="col-val">56</td><td class="col-val">38</td><td class="col-val">00111000</td></tr>
    <tr><td class="col-code"><strong>9</strong></td><td class="col-val">57</td><td class="col-val">39</td><td class="col-val">00111001</td></tr>
    <tr><td class="col-code"><strong>A</strong></td><td class="col-val">65</td><td class="col-val">41</td><td class="col-val">01000001</td></tr>
    <tr><td class="col-code"><strong>B</strong></td><td class="col-val">66</td><td class="col-val">42</td><td class="col-val">01000010</td></tr>
    <tr><td class="col-code"><strong>C</strong></td><td class="col-val">67</td><td class="col-val">43</td><td class="col-val">01000011</td></tr>
    <tr><td class="col-code"><strong>D</strong></td><td class="col-val">68</td><td class="col-val">44</td><td class="col-val">01000100</td></tr>
    <tr><td class="col-code"><strong>E</strong></td><td class="col-val">69</td><td class="col-val">45</td><td class="col-val">01000101</td></tr>
    <tr><td class="col-code"><strong>F</strong></td><td class="col-val">70</td><td class="col-val">46</td><td class="col-val">01000110</td></tr>
    <tr><td class="col-code"><strong>G</strong></td><td class="col-val">71</td><td class="col-val">47</td><td class="col-val">01000111</td></tr>
    <tr><td class="col-code"><strong>H</strong></td><td class="col-val">72</td><td class="col-val">48</td><td class="col-val">01001000</td></tr>
    <tr><td class="col-code"><strong>I</strong></td><td class="col-val">73</td><td class="col-val">49</td><td class="col-val">01001001</td></tr>
    <tr><td class="col-code"><strong>J</strong></td><td class="col-val">74</td><td class="col-val">4A</td><td class="col-val">01001010</td></tr>
    <tr><td class="col-code"><strong>K</strong></td><td class="col-val">75</td><td class="col-val">4B</td><td class="col-val">01001011</td></tr>
    <tr><td class="col-code"><strong>L</strong></td><td class="col-val">76</td><td class="col-val">4C</td><td class="col-val">01001100</td></tr>
    <tr><td class="col-code"><strong>M</strong></td><td class="col-val">77</td><td class="col-val">4D</td><td class="col-val">01001101</td></tr>
    <tr><td class="col-code"><strong>N</strong></td><td class="col-val">78</td><td class="col-val">4E</td><td class="col-val">01001110</td></tr>
    <tr><td class="col-code"><strong>O</strong></td><td class="col-val">79</td><td class="col-val">4F</td><td class="col-val">01001111</td></tr>
    <tr><td class="col-code"><strong>P</strong></td><td class="col-val">80</td><td class="col-val">50</td><td class="col-val">01010000</td></tr>
    <tr><td class="col-code"><strong>Q</strong></td><td class="col-val">81</td><td class="col-val">51</td><td class="col-val">01010001</td></tr>
    <tr><td class="col-code"><strong>R</strong></td><td class="col-val">82</td><td class="col-val">52</td><td class="col-val">01010010</td></tr>
    <tr><td class="col-code"><strong>S</strong></td><td class="col-val">83</td><td class="col-val">53</td><td class="col-val">01010011</td></tr>
    <tr><td class="col-code"><strong>T</strong></td><td class="col-val">84</td><td class="col-val">54</td><td class="col-val">01010100</td></tr>
    <tr><td class="col-code"><strong>U</strong></td><td class="col-val">85</td><td class="col-val">55</td><td class="col-val">01010101</td></tr>
    <tr><td class="col-code"><strong>V</strong></td><td class="col-val">86</td><td class="col-val">56</td><td class="col-val">01010110</td></tr>
    <tr><td class="col-code"><strong>W</strong></td><td class="col-val">87</td><td class="col-val">57</td><td class="col-val">01010111</td></tr>
    <tr><td class="col-code"><strong>X</strong></td><td class="col-val">88</td><td class="col-val">58</td><td class="col-val">01011000</td></tr>
    <tr><td class="col-code"><strong>Y</strong></td><td class="col-val">89</td><td class="col-val">59</td><td class="col-val">01011001</td></tr>
    <tr><td class="col-code"><strong>Z</strong></td><td class="col-val">90</td><td class="col-val">5A</td><td class="col-val">01011010</td></tr>
    <tr><td class="col-code"><strong>a</strong></td><td class="col-val">97</td><td class="col-val">61</td><td class="col-val">01100001</td></tr>
    <tr><td class="col-code"><strong>b</strong></td><td class="col-val">98</td><td class="col-val">62</td><td class="col-val">01100010</td></tr>
    <tr><td class="col-code"><strong>c</strong></td><td class="col-val">99</td><td class="col-val">63</td><td class="col-val">01100011</td></tr>
    <tr><td class="col-code"><strong>d</strong></td><td class="col-val">100</td><td class="col-val">64</td><td class="col-val">01100100</td></tr>
    <tr><td class="col-code"><strong>e</strong></td><td class="col-val">101</td><td class="col-val">65</td><td class="col-val">01100101</td></tr>
    <tr><td class="col-code"><strong>f</strong></td><td class="col-val">102</td><td class="col-val">66</td><td class="col-val">01100110</td></tr>
    <tr><td class="col-code"><strong>g</strong></td><td class="col-val">103</td><td class="col-val">67</td><td class="col-val">01100111</td></tr>
    <tr><td class="col-code"><strong>h</strong></td><td class="col-val">104</td><td class="col-val">68</td><td class="col-val">01101000</td></tr>
    <tr><td class="col-code"><strong>i</strong></td><td class="col-val">105</td><td class="col-val">69</td><td class="col-val">01101001</td></tr>
    <tr><td class="col-code"><strong>j</strong></td><td class="col-val">106</td><td class="col-val">6A</td><td class="col-val">01101010</td></tr>
    <tr><td class="col-code"><strong>k</strong></td><td class="col-val">107</td><td class="col-val">6B</td><td class="col-val">01101011</td></tr>
    <tr><td class="col-code"><strong>l</strong></td><td class="col-val">108</td><td class="col-val">6C</td><td class="col-val">01101100</td></tr>
    <tr><td class="col-code"><strong>m</strong></td><td class="col-val">109</td><td class="col-val">6D</td><td class="col-val">01101101</td></tr>
    <tr><td class="col-code"><strong>n</strong></td><td class="col-val">110</td><td class="col-val">6E</td><td class="col-val">01101110</td></tr>
    <tr><td class="col-code"><strong>o</strong></td><td class="col-val">111</td><td class="col-val">6F</td><td class="col-val">01101111</td></tr>
    <tr><td class="col-code"><strong>p</strong></td><td class="col-val">112</td><td class="col-val">70</td><td class="col-val">01110000</td></tr>
    <tr><td class="col-code"><strong>q</strong></td><td class="col-val">113</td><td class="col-val">71</td><td class="col-val">01110001</td></tr>
    <tr><td class="col-code"><strong>r</strong></td><td class="col-val">114</td><td class="col-val">72</td><td class="col-val">01110010</td></tr>
    <tr><td class="col-code"><strong>s</strong></td><td class="col-val">115</td><td class="col-val">73</td><td class="col-val">01110011</td></tr>
    <tr><td class="col-code"><strong>t</strong></td><td class="col-val">116</td><td class="col-val">74</td><td class="col-val">01110100</td></tr>
    <tr><td class="col-code"><strong>u</strong></td><td class="col-val">117</td><td class="col-val">75</td><td class="col-val">01110101</td></tr>
    <tr><td class="col-code"><strong>v</strong></td><td class="col-val">118</td><td class="col-val">76</td><td class="col-val">01110110</td></tr>
    <tr><td class="col-code"><strong>w</strong></td><td class="col-val">119</td><td class="col-val">77</td><td class="col-val">01110111</td></tr>
    <tr><td class="col-code"><strong>x</strong></td><td class="col-val">120</td><td class="col-val">78</td><td class="col-val">01111000</td></tr>
    <tr><td class="col-code"><strong>y</strong></td><td class="col-val">121</td><td class="col-val">79</td><td class="col-val">01111001</td></tr>
    <tr><td class="col-code"><strong>z</strong></td><td class="col-val">122</td><td class="col-val">7A</td><td class="col-val">01111010</td></tr>
  </tbody>
</table>

### Klíčové řídicí a interpunkční znaky

<table>
  <thead>
    <tr>
      <th class="col-code">Znak</th>
      <th class="col-val">Dec</th>
      <th class="col-val">Hex</th>
      <th class="col-name">Význam</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="col-code"><strong>NUL</strong></td><td class="col-val">0</td><td class="col-val">00</td><td class="col-name">Null (konec řetězce v C)</td></tr>
    <tr><td class="col-code"><strong>TAB</strong></td><td class="col-val">9</td><td class="col-val">09</td><td class="col-name">Tabulátor (\t)</td></tr>
    <tr><td class="col-code"><strong>LF</strong></td><td class="col-val">10</td><td class="col-val">0A</td><td class="col-name">Line Feed (konec řádku Unix, \n)</td></tr>
    <tr><td class="col-code"><strong>CR</strong></td><td class="col-val">13</td><td class="col-val">0D</td><td class="col-name">Carriage Return (\r)</td></tr>
    <tr><td class="col-code"><strong>ESC</strong></td><td class="col-val">27</td><td class="col-val">1B</td><td class="col-name">Escape</td></tr>
    <tr><td class="col-code"><strong>SP</strong></td><td class="col-val">32</td><td class="col-val">20</td><td class="col-name">Mezera (Space)</td></tr>
    <tr><td class="col-code"><strong>!</strong></td><td class="col-val">33</td><td class="col-val">21</td><td class="col-name">Vykřičník</td></tr>
    <tr><td class="col-code"><strong>"</strong></td><td class="col-val">34</td><td class="col-val">22</td><td class="col-name">Uvozovky</td></tr>
    <tr><td class="col-code"><strong>#</strong></td><td class="col-val">35</td><td class="col-val">23</td><td class="col-name">Křížek / Mřížka</td></tr>
    <tr><td class="col-code"><strong>$</strong></td><td class="col-val">36</td><td class="col-val">24</td><td class="col-name">Dolar</td></tr>
    <tr><td class="col-code"><strong>%</strong></td><td class="col-val">37</td><td class="col-val">25</td><td class="col-name">Procento</td></tr>
    <tr><td class="col-code"><strong>&amp;</strong></td><td class="col-val">38</td><td class="col-val">26</td><td class="col-name">Ampersand</td></tr>
    <tr><td class="col-code"><strong>+</strong></td><td class="col-val">43</td><td class="col-val">2B</td><td class="col-name">Plus</td></tr>
    <tr><td class="col-code"><strong>-</strong></td><td class="col-val">45</td><td class="col-val">2D</td><td class="col-name">Minus / Pomlčka</td></tr>
    <tr><td class="col-code"><strong>/</strong></td><td class="col-val">47</td><td class="col-val">2F</td><td class="col-name">Lomítko</td></tr>
    <tr><td class="col-code"><strong>:</strong></td><td class="col-val">58</td><td class="col-val">3A</td><td class="col-name">Dvojtečka</td></tr>
    <tr><td class="col-code"><strong>;</strong></td><td class="col-val">59</td><td class="col-val">3B</td><td class="col-name">Středník</td></tr>
    <tr><td class="col-code"><strong>?</strong></td><td class="col-val">63</td><td class="col-val">3F</td><td class="col-name">Otazník</td></tr>
    <tr><td class="col-code"><strong>@</strong></td><td class="col-val">64</td><td class="col-val">40</td><td class="col-name">Zavináč</td></tr>
    <tr><td class="col-code"><strong>DEL</strong></td><td class="col-val">127</td><td class="col-val">7F</td><td class="col-name">Delete</td></tr>
  </tbody>
</table>
