    @echo off
    setlocal enabledelayedexpansion

    set base=10
    set /a half_base = base / 2
    set nan_value=NaN

    set action=%~1
    if "%action%"=="/?" goto :show_help
    if "%action%"=="" goto :show_help
    echo "add" "sub" "mul" "div" "mod" "sqrt" | findstr ""%action%"" >nul || goto :show_help

    set a=%~2
    set b=%~3
    if "!a!"=="" goto :show_help
    call :check_number "!a!"
    if not "!res!"=="1" goto :show_format_error
    call :from_string "!a!"
    set a=!res!
    if not "%action%"=="sqrt" (
        if "!b!"=="" goto :show_help
        call :check_number "!b!"
        if not "!res!"=="1" goto :show_format_error
        set b=!b!
        call :from_string "!b!"
        set b=!res!
    )

    call :%~1 "%a%" "%b%"
    call :to_string "%res%"
    echo Result: %res%

    goto :eof


:show_format_error
    echo Error: Only unsigned integer numbers are supported
    goto :eof


:show_help
    echo Calculate result of an operation using long arithmetic
    echo]
    echo %0 add A B
    echo %0 sub A B
    echo %0 mul A B
    echo %0 div A B
    echo %0 mod A B
    echo %0 sqrt NUMBER
    echo]
    echo Only unsigned integer numbers are supported.
    echo Non-integer results will be rounded down.
    goto :eof


:show_wait
    echo | set /p=Please wait.
    goto :eof


:show_progress
    echo | set /p=.
    goto :eof


:check_number
    set res=1
    echo %~1| findstr /r "^[0-9][0-9]*$">nul || set res=0
    goto :eof


:reverse
    setlocal enabledelayedexpansion
    set str=%~1
    if "%str%"=="" (
        set res=
        goto :reverse_return
    )
    if "%str%"=="%nan_value%" (
        set res=%nan_value%
        goto :reverse_return
    )
    set index=0
    set res=
:reverse_loop
    set ch=!str:~%index%,1!
    if "%ch%"=="" goto :reverse_return
    set res=%ch%%res%
    set /a index += 1
    goto :reverse_loop
:reverse_return
    endlocal && set res=%res%
    goto :eof


:from_string
    if "%~1"=="0" (
        set res=
    ) else (
        call :reverse "%~1"
    )
    goto :eof


:to_string
    if "%~1"=="%nan_value%" (
        set res=%~1
        goto :eof
    )
    if "%~1"=="" (
        set res=0
    ) else (
        call :reverse "%~1"
    )
    goto :eof


:skip_zeros
    setlocal
    set number=%~1
    if "%number%"=="" (
        set res=
        goto :skip_zeros_return
    )
    set last_non_zero=-1
    set index=0
:skip_zeros_loop
    set digit=!number:~%index%,1!
    if "%digit%"=="" goto :skip_zeros_cut
    if not "%digit%"=="0" set last_non_zero=%index%
    set /a index += 1
    goto :skip_zeros_loop
:skip_zeros_cut
    set /a length = last_non_zero + 1
    set res=!number:~0,%length%!
:skip_zeros_return
    endlocal && set res=%res%
    goto :eof


:add
    setlocal
    set a=%~1
    set b=%~2
    if "%a%"=="" (
        set res=%b%
        goto :add_return
    )
    if "%b%"=="" (
        set res=%a%
        goto :add_return
    )
    set res=
    set carry=0
    set index=0
:add_loop
    set a_digit=!a:~%index%,1!
    set b_digit=!b:~%index%,1!
    if "%a_digit%"=="" if "%b_digit%"=="" if %carry%==0 goto :add_return
    if "%a_digit%"=="" set a_digit=0
    if "%b_digit%"=="" set b_digit=0
    set /a res_digit = a_digit + b_digit + carry
    if %res_digit% geq %base% (
        set carry=1
        set /a res_digit -= base
    ) else (
        set carry=0
    )
    set res=%res%%res_digit%
    set /a index += 1
    goto :add_loop
:add_return
    endlocal && set res=%res%
    goto :eof


:sub
    setlocal
    set a=%~1
    set b=%~2
    if "%b%"=="" (
        set res=%a%
        goto :sub_return
    )
    if "%a%"=="" (
        set res=%nan_value%
        goto :sub_return
    )
    set res=
    set carry=0
    set index=0
:sub_loop
    set a_digit=!a:~%index%,1!
    set b_digit=!b:~%index%,1!
    if "%a_digit%"=="" (
        if %carry% neq 0 set res=%nan_value%
        if not "%b_digit%"=="" set res=%nan_value%
        goto :sub_skip_zeros
    )
    if "%b_digit%"=="" set b_digit=0
    set /a res_digit = a_digit - b_digit - carry
    if %res_digit% lss 0 (
        set carry=1
        set /a res_digit += base
    ) else (
        set carry=0
    )
    set res=%res%%res_digit%
    set /a index += 1
    goto :sub_loop
:sub_skip_zeros
    call :skip_zeros "%res%"
:sub_return
    endlocal && set res=%res%
    goto :eof


:mul
    setlocal
    set a=%~1
    set b=%~2
    set res=
    if "%a%"=="" goto :mul_return
    if "%b%"=="" goto :mul_return
    set carry=0
    set i=0
:mul_loop_i
    set a_digit=!a:~%i%,1!
    if "%a_digit%"=="" goto :mul_return
    set j=0
:mul_loop_j
    set b_digit=!b:~%j%,1!
    if "%b_digit%"=="" if %carry%==0 goto :mool_loop_i_continue
    if "%b_digit%"=="" set b_digit=0
    set /a k = i + j
    set /a k_next = k + 1
    if "%res%" == "" (
        set res=0
        set prev_digit=0
    ) else (
        set prev_digit=!res:~%k%,1!
        if "!prev_digit!" == "" (
            set res=!res!0
            set prev_digit=0
        )
    )
    set /a res_digit = prev_digit + a_digit * b_digit + carry
    set /a carry = res_digit / base
    set /a res_digit %%= base
    set res=!res:~0,%k%!%res_digit%!res:~%k_next%!
    set /a j += 1
    goto :mul_loop_j
:mool_loop_i_continue
    set /a i += 1
    goto :mul_loop_i
:mul_return
    endlocal && set res=%res%
    goto :eof


:div2
    setlocal
    set number=%~1
    if "%number%"=="" (
        set res=
        goto :div2_return
    )
    call :reverse "%number%"
    set number=%res%
    set res=
    set carry=0
    set index=0
:div2_loop
    set digit=!number:~%index%,1!
    if "%digit%"=="" goto :div2_skip_zeros
    set /a next_carry = digit & 1
    set /a digit /= 2
    if %carry%==1 set /a digit += half_base
    set carry=%next_carry%
    set res=%digit%%res%
    set /a index += 1
    goto :div2_loop
:div2_skip_zeros
    call :skip_zeros "%res%"
:div2_return
    endlocal && set res=%res%
    goto :eof


:div
    setlocal
    set a=%~1
    set b=%~2
    if "%b%"=="" (
        set res=%nan_value%
        goto :div_return
    )
    if "%a%"=="" (
        set res=
        goto :div_return
    )
    set l=
    call :add "%a%" 1
    set r=%res%
    call :show_wait
:div_binsearch_loop
    call :sub "%l%" "%r%"
    if not "%res%"=="%nan_value%" (
        call :sub "!l!" 1
        goto :div_return
    )

    call :add "%l%" "%r%"
    call :div2 "%res%"
    set middle=%res%
    call :show_progress

    call :mul "%middle%" "%b%"
    call :sub "%res%" "%a%"
    set need_change_l=0
    if "%res%"=="%nan_value%" set need_change_l=1
    if "%res%"=="" set need_change_l=1
    if %need_change_l%==1 (
        call :add "!middle!" 1
        set l=!res!
    ) else (
        set r=!middle!
    )
    goto :div_binsearch_loop
:div_return
    echo]
    endlocal && set res=%res%
    goto :eof


:mod
    setlocal
    set a=%~1
    set b=%~2
    call :div "%a%" "%b%"
    call :mul "%res%" "%b%"
    call :sub "%a%" "%res%"
    endlocal & set res=%res%
    goto :eof


:sqrt
    setlocal
    set number=%~1
    if "%number%"=="" (
        set res=
        goto :sqrt_return
    )
    set l=
    call :add "%number%" 1
    set r=%res%
    call :show_wait
:sqrt_binsearch_loop
    call :sub "%l%" "%r%"
    if not "%res%"=="%nan_value%" (
        call :sub "!l!" 1
        goto :sqrt_return
    )

    call :add "%l%" "%r%"
    call :div2 "%res%"
    set middle=%res%
    call :show_progress

    call :mul "%middle%" "%middle%"
    call :sub "%res%" "%number%"
    set need_change_l=0
    if "%res%"=="%nan_value%" set need_change_l=1
    if "%res%"=="" set need_change_l=1
    if %need_change_l%==1 (
        call :add "!middle!" 1
        set l=!res!
    ) else (
        set r=!middle!
    )
    goto :sqrt_binsearch_loop
:sqrt_return
    echo]
    endlocal && set res=%res%
    goto :eof
