import { AvStandardGrabbable, GrabbableStyle, renderAardvarkRoot } from '@aardvarkxr/aardvark-react';
import { g_builtinModelBox } from '@aardvarkxr/aardvark-shared';
import * as React from 'react';

enum CalcKey
{
	Number0 	= 0,
	Number1 	= 1,
	Number2 	= 2,
	Number3 	= 3,
	Number4 	= 4,
	Number5 	= 5,
	Number6 	= 6,
	Number7 	= 7,
	Number8 	= 8,
	Number9 	= 9,

	OpPlus 		= 10,
	OpMinus 	= 11,
	OpMultiply	= 12,
	OpDivide	= 13,
	OpEquals	= 14,
	OpDecimal	= 15,
}

enum CalcState
{
	ShowingPrevious,
	Number,
	StartingNumber,
	Error,
}

class CalcImpl
{
	private state = CalcState.StartingNumber;
	private decimalPlace: number = 1;
	private currentValue: number = 0;
	private previousValue: number = 0;
	private sign: number = 1;
	private pendingOperation: CalcKey = CalcKey.OpEquals;

	constructor()
	{}

	public processKey( key: CalcKey )
	{
		switch( this.state )
		{
			case CalcState.ShowingPrevious:
				switch( key )
				{
					case CalcKey.OpMinus:
					case CalcKey.OpPlus:
					case CalcKey.OpMultiply:
					case CalcKey.OpDivide:
					case CalcKey.OpEquals:
						this.state = CalcState.StartingNumber;
						this.pendingOperation = key;
						break;

					default:
						this.state = CalcState.Number;
						this.processKey_Number( key );
				}
				break;

			case CalcState.Error:
				this.state = CalcState.Number;
				this.processKey_Number( key );
				break;

			case CalcState.StartingNumber:
				this.state = CalcState.Number;
				if( key == CalcKey.OpMinus )
				{
					// this is a negative number
					this.sign = -1;
					break;
				}
				// FALL THROUGH TO NUMBER!

			case CalcState.Number:
				this.processKey_Number( key );
				break;
		}

		console.log( `After processKey ${ CalcKey[ key ] }: state: ${ CalcState[ this.state ]}, decimalPlace: ${ this.decimalPlace }, `
			+ `currentValue: ${ this.currentValue }, previousValue: ${ this.previousValue }, pendingOperation: ${ CalcKey[ this.pendingOperation ] }` );
	}

	private processKey_Number( key: CalcKey )
	{
		switch( key )
		{
			case CalcKey.Number0:
			case CalcKey.Number1:
			case CalcKey.Number2:
			case CalcKey.Number3:
			case CalcKey.Number4:
			case CalcKey.Number5:
			case CalcKey.Number6:
			case CalcKey.Number7:
			case CalcKey.Number8:
			case CalcKey.Number9:
				let digit = key as number;
				if( this.decimalPlace < 1 )
				{
					this.currentValue += digit * this.decimalPlace;
					this.decimalPlace /= 10;
				}
				else
				{
					this.currentValue = this.currentValue * 10 + digit;
				}
				break;

			case CalcKey.OpDecimal:
				if( this.decimalPlace < 1 )
				{
					// we've already had a decimal place. Just ignore the
					// second one
				}
				else
				{
					this.decimalPlace = 0.1;
				}
				break;

			case CalcKey.OpPlus:
			case CalcKey.OpMinus:
			case CalcKey.OpMultiply:
			case CalcKey.OpDivide:
			case CalcKey.OpEquals:
				this.resolvePendingOp();
				this.pendingOperation = key;
				this.decimalPlace = 1;
				this.currentValue = 0;
				this.sign = 1;
				this.state = CalcState.ShowingPrevious;
		}
	}

	private resolvePendingOp()
	{
		let realCurrentValue = this.sign * this.currentValue;
		switch( this.pendingOperation )
		{
			case CalcKey.OpDivide:
				if( this.currentValue == 0 )
				{
					this.setError();
				}
				else
				{
					this.previousValue = this.previousValue / realCurrentValue;
				}
				break;

			case CalcKey.OpMultiply:
				this.previousValue = this.previousValue * realCurrentValue;
				break;

			case CalcKey.OpMinus:
				this.previousValue = this.previousValue - realCurrentValue;
				break;
			case CalcKey.OpPlus:
				this.previousValue = this.previousValue + realCurrentValue;
				break;

			case CalcKey.OpEquals:
				this.previousValue = realCurrentValue;
				break;
		}
		this.pendingOperation = CalcKey.OpEquals;
	}

	private setError()
	{
		this.state = CalcState.Error;
	}

	public get output(): string
	{
		switch( this.state )
		{
			case CalcState.Error:
				return "Error";

			case CalcState.StartingNumber:
				return "";

			case CalcState.Number:
				if( this.sign == -1 && this.currentValue == 0 )
					return "-";
				else
					return ( this.sign * this.currentValue ).toString();
			
			case CalcState.ShowingPrevious:
				return this.previousValue.toString();
		}
	}
}

class MyGadget extends React.Component< {}, {} >
{
	constructor( props: any )
	{
		super( props );
		this.state = {};
	}

	public render()
	{
		return (
			<AvStandardGrabbable modelUri={ g_builtinModelBox } modelScale={ 0.03 } 
				modelColor="lightblue" style={ GrabbableStyle.Gadget } remoteInterfaceLocks={ [] } >
				{ 
					/* gadget contents go here */ 
				}
			</AvStandardGrabbable>
			);
	}
}


class CalcTester extends React.Component< {}, {} >
{
	private impl = new CalcImpl();

	private renderKey( glyph: string, key: CalcKey )
	{
		return <div className="Key" onClick={ 
			() => 
			{ 
				this.impl.processKey( key );
				this.forceUpdate();
			}
			}>
			{ glyph }</div>;
	}

	public render()
	{
		return <div className="Controls">
			<div className="Output">{ this.impl.output }</div>
			<div className="Row">
				{ this.renderKey( "+", CalcKey.OpPlus ) }
				{ this.renderKey( "-", CalcKey.OpMinus ) }
				{ this.renderKey( "X", CalcKey.OpMultiply ) }
				{ this.renderKey( "÷", CalcKey.OpDivide ) }
			</div>
			<div className="Row">
				{ this.renderKey( "7", CalcKey.Number7 ) }
				{ this.renderKey( "8", CalcKey.Number8 ) }
				{ this.renderKey( "9", CalcKey.Number9 ) }
			</div>
			<div className="Row">
				{ this.renderKey( "4", CalcKey.Number4 ) }
				{ this.renderKey( "5", CalcKey.Number5 ) }
				{ this.renderKey( "6", CalcKey.Number6 ) }
			</div>
			<div className="Row">
				{ this.renderKey( "1", CalcKey.Number1 ) }
				{ this.renderKey( "2", CalcKey.Number2 ) }
				{ this.renderKey( "3", CalcKey.Number3 ) }
			</div>
			<div className="Row">
				{ this.renderKey( "0", CalcKey.Number0 ) }
				{ this.renderKey( ".", CalcKey.OpDecimal ) }
				{ this.renderKey( "=", CalcKey.OpEquals ) }
			</div>
		</div>;
	}
}


renderAardvarkRoot( "root", <MyGadget/>, <CalcTester/> );
