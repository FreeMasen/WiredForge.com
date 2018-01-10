+++
title = "Understanding Binary, Pt 1"
draft = true
[extra]
snippet = "A guide to understanding binary from a programmer's perspective"
+++

If you have been interested in computers for any length of time, someone has probably told you that computers “think” in binary. I am going to try and explain what that means and why you should care. 

To be through, a good definition of binary is “a system for representing numbers where there are unlimited positions and 2 (0-1) possible values in each position”. To put this in perspective, the most common number system (Hindu–Arabic numeral system) would have the definition “a system for representing numbers where there are an unlimited positions and 10 (0-9) possible values in each position.”

To illustrate how this works, consider this table:

<table>
<tr>
<th>128</th> 
<th>64</th>
<th>32</th>
<th>16</th>
<th>8</th>
<th>4</th>
<th>2</th>
<th>1</th>
<th>total</th>
<tr>
<td>0</td>
<td>0</td> 
<td>0</td>
<td>0</td>
<td>0</td>
<td>0</td>
<td>0</td>
<td>0</td>
<th>0</td>
</tr>
</table>
<button>Start counting</button>

If you click on any of the cells in the second row, it will add the number in the header to the total value. You can also click the `start counting` button to watch how wach number is configured in binary. 

The basic idea here is that each position has a value assigned to it, if the position have a value of 1 it will be included in the total, if 0 it will not be included. An interesting thing to point out is that each value is exactly 1 greater than all of the values to the right of that value, this will become very powerful later on. 

