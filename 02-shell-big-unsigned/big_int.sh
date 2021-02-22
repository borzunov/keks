#!/bin/bash

base=10
(( half_base = base / 2 ))
nan_value=NaN

function main {
	action="$1"
	if contains "$action" add sub mul div mod; then
		check_decimal "$2" "$3"
		to_decimal "$($action "$(from_decimal $2)" "$(from_decimal $3)")"
	elif [[ "$action" == "sqrt" ]]; then
		check_decimal "$2"
		to_decimal "$($action "$(from_decimal $2)")"
	else
		show_help
	fi
}

function show_help {
	cat <<end
Usage: $0 add A B
       $0 sub A B
       $0 mul A B
       $0 div A B
       $0 mod A B
       $0 sqrt NUMBER
Calculate result of an operation using long arithmetic.

Only unsigned integer numbers are supported.
Non-integer results will be rounded down.
end
	exit 1
}

function contains {
	local elem
	for elem in "${@:2}"; do
		if [[ "$elem" == "$1" ]]; then
			return 0
		fi
	done
	return 1
}

function check_decimal {
	local elem
	for elem in "$@"; do
		if [[ "$elem" == "" ]]; then
			show_help
		fi
		if [[ ! "$elem" =~ ^[0-9]+$ ]]; then
			echo "Error: Only unsigned integer numbers are supported"
			exit 1
		fi
	done
}

function from_decimal {
	echo "$1" | sed -r 's/^0//g' | rev | sed -r 's/./& /g'
}

function to_decimal {
	echo "$1" | tr -d ' ' | rev | sed -r 's/^$/0/'
}

function add {
	local -a a=($1)
	local -a b=($2)
	local -a res
	local -i carry=0
	local -i i
	local -i a_length=${#a[*]}
	local -i b_length=${#b[*]}
	for (( i = 0; i < a_length || i < b_length || carry; i++ )); do
		local -i digit
		(( digit = a[i] + b[i] + carry ))
		if (( digit >= base )); then
			(( digit -= base ))
			carry=1
		else
			carry=0
		fi
		(( res[i] = digit ))
	done
	echo "${res[*]}"
}

function skip_zeros {
	echo "$1" | sed -r 's/(0 ?)+$//'
}

function sub {
	local -a a=($1)
	local -a b=($2)
	local -a res
	local -i carry=0
	local -i i
	local -i a_length=${#a[*]}
	local -i b_length=${#b[*]}
	for (( i = 0; i < a_length || i < b_length || carry; i++ )); do
		if (( i >= a_length )); then
			echo $nan_value
			return
		fi
		local -i digit
		(( digit = a[i] - b[i] - carry ))
		if (( digit < 0 )); then
			(( digit += base ))
			carry=1
		else
			carry=0
		fi
		(( res[i] = digit ))
	done
	skip_zeros "${res[*]}"
}

function mul {
	local -a a=($1)
	local -a b=($2)
	local -a res
	local -i carry=0
	local i j
	local -i a_length=${#a[*]}
	local -i b_length=${#b[*]}
	for (( i = 0; i < a_length; i++ )); do
		for (( j = 0; j < b_length || carry; j++ )); do
			local -i k
			(( k = i + j ))
			local -i digit
			(( digit = res[k] + a[i] * b[j] + carry ))
			(( carry = digit / base ))
			(( res[k] = digit % base ))
		done
	done
	echo "${res[*]}"
}

function div2 {
	local -a number=($(echo "$1" | rev))
	local -a res
	local -i carry=0
	local -i length=${#number[*]}
	for (( i = 0; i < length; i++ )); do
		local -i digit next_carry
		(( digit = number[i] ))
		(( next_carry = digit & 1 ))
		(( digit >>= 1 ))
		if (( carry == 1 )); then
			(( digit += half_base ))
		fi
		carry=$next_carry
		(( res[i] = digit ))
	done
	skip_zeros "$(echo "${res[*]}" | rev)"
}

function div {
	local -a a=($1)
	local -a b=($2)
	if (( ${#b[*]} == 0 )); then
		echo $nan_value
		return
	fi
	local -a l=()
	local -a r=($(add "${a[*]}" 1))
	while true; do
		local diff="$(sub "${l[*]}" "${r[*]}")"
		if [[ "$diff" != "$nan_value" ]]; then
			break
		fi
		local -a middle=($(div2 "$(add "${l[*]}" "${r[*]}")"))
		local -a product=($(mul "${middle[*]}" "${b[*]}"))
		diff="$(sub "${product[*]}" "${a[*]}")"
		if [[ "$diff" == "$nan_value" || "$diff" =~ ^\ *$ ]]; then
			l=($(add "${middle[*]}" 1))
		else
			r=(${middle[*]})
		fi
	done
	sub "${l[*]}" 1
}

function mod {
	local -a a=($1)
	local -a b=($2)
	local divided="$(div "${a[*]}" "${b[*]}")"
	if [[ "$divided" == "$nan_value" ]]; then
		echo $nan_value
		return
	fi
	sub "${a[*]}" "$(mul "$divided" "${b[*]}")"
}

function sqrt {
	local -a number=($1)
	local -a l=()
	local -a r=($(add "${number[*]}" 1))
	while true; do
		local diff="$(sub "${l[*]}" "${r[*]}")"
		if [[ "$diff" != "$nan_value" ]]; then
			break
		fi
		local -a middle=($(div2 "$(add "${l[*]}" "${r[*]}")"))
		local -a product=($(mul "${middle[*]}" "${middle[*]}"))
		diff="$(sub "${product[*]}" "${number[*]}")"
		if [[ "$diff" == "$nan_value" || "$diff" =~ ^\ *$ ]]; then
			l=($(add "${middle[*]}" 1))
		else
			r=(${middle[*]})
		fi
	done
	sub "${l[*]}" 1
}

main $@